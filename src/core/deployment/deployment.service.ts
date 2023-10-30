import { Injectable, Logger } from '@nestjs/common';
import { PreviewConfigService } from '../preview_config/preview_config.service';
import { ForgeService } from '../forge/forge.service';
import dedent from 'dedent';
import { ContextService } from 'src/github/context/context.service';
import { EnvoyerService } from '../envoyer/envoyer.service';
import { Site } from '../forge/models/site';
import { Database } from '../pscale/models/database';
import { PlanetScaleService } from '../pscale/pscale.service';
import { Credentials } from '../pscale/models/credentials';
import * as crypto from 'node:crypto';

interface Preview {
  url: string;
}

interface MergeResult {
  planetScaleRequestUrl: string;
}

@Injectable()
export class DeploymentService {
  private readonly logger = new Logger(DeploymentService.name);

  constructor(
    private readonly configService: PreviewConfigService,
    private readonly contextService: ContextService,
    private readonly forgeService: ForgeService,
    private readonly envoyerService: EnvoyerService,
    private readonly pscaleService: PlanetScaleService,
  ) {}

  private createEnv(
    baseEnv: string,
    site: Site,
    database: Database,
    creds: Credentials,
  ) {
    this.logger.log(`Creating an environment for ${site.name}`);

    return dedent`${baseEnv}
    APP_URL=${site.name}
    APP_KEY=base64:${crypto.randomBytes(32).toString('base64')}
    
    DB_CONNECTION=mysql
    DB_HOST=aws.connect.psdb.cloud
    DB_PORT=3306
    DB_DATABASE=${database.name}
    DB_USERNAME=${creds.username}
    DB_PASSWORD=${creds.password}
    MYSQL_ATTR_SSL_CA=/etc/ssl/certs/ca-certificates.crt
    `;
  }

  private getEnvoyerProjectName(): string {
    const pr = this.contextService.getPullRequest();
    const branchName = pr.branchName;

    const baseProjectName =
      this.configService.getProjectName() || titleCase(pr.repo.name);

    return `${baseProjectName} - ${titleCase(branchName)}`;
  }

  private getServerInfo(): { id: number; domain: string } {
    const servers = this.configService.getServers();
    return servers[0];
  }

  private getSiteName(): string {
    const { domain } = this.getServerInfo();

    const pr = this.contextService.getPullRequest();
    const branchName = pr.branchName;

    return `${urlName(branchName)}.${domain}`;
  }

  private getDbInfo() {
    const pr = this.contextService.getPullRequest();
    const branchName = pr.branchName;

    const branchMappings = this.configService.getBranchMappings();

    const base = dbBranchName(pr.baseBranchName, branchMappings);
    const branch = dbBranchName(branchName, branchMappings);
    const backupName = base + '__' + branch;

    return { base, branch, backupName };
  }

  private async getForgeServer() {
    const { id: serverId } = this.getServerInfo();
    this.logger.log(`loading server with ID ${serverId}`);
    return this.forgeService.getServer(serverId);
  }

  private async getPlanetScaleDatabase() {
    this.logger.log(`loading database info for PlanetScale`);
    const orgName = this.configService.getPScaleOrganization();
    const dbName = this.configService.getPScaleDatabase();

    this.logger.log(`loading organization "${orgName}" from PlanetScale`);
    const org = await this.pscaleService.getOrganization(orgName);
    this.logger.log(
      `getting database "${dbName}" for organization "${orgName}"`,
    );
    const database = await org.getDatabase(dbName);
    return database;
  }

  async createPreview(): Promise<Preview> {
    const siteName = this.getSiteName();
    const projectName = this.getEnvoyerProjectName();
    const phpVersion = this.configService.getPhpVersion();

    const db = this.getDbInfo();

    // Forge
    const server = await this.getForgeServer();

    this.logger.log(
      `Checking for site named ${siteName} on server ${server.id}`,
    );
    let site = await server.findSite(siteName);
    if (site != null) {
      this.logger.log(`site exists`);
    } else {
      const databaseName = siteName.replace(/-/g, '_').replace(/[^\w_]/g, '');
      this.logger.log(`Sanitized database name: '${databaseName}'`);

      this.logger.log(`Creating site ${siteName}`);
      site = await server.createSite(siteName, databaseName);
    }
    this.logger.log(`Checking for SSL Certificate on forge`);
    const certs = await site.listCerts();
    let cert = certs.find((cert) => cert.domain === site.name);
    if (cert != null) {
      this.logger.log('cert exists');
    } else {
      this.logger.log(`Creating certificate with LetsEncrypt`);
      cert = await site.createLetsEncryptCert();
    }
    await cert.waitUntilReady();

    // PlanetScale
    const database = await this.getPlanetScaleDatabase();

    this.logger.log(`Getting base branch "${db.base}"`);
    const baseBranch = await database.getBranch(db.base);
    this.logger.log(
      `Creating backup "${db.backupName}" of branch "${db.base}"`,
    );
    const backup = await baseBranch.ensureBackup(db.backupName);
    await backup.waitUntilReady();
    this.logger.log(
      `Forking branch "${db.branch}" from base branch "${db.base}"`,
    );
    const branch = await baseBranch.ensureForkBranch(db.branch, backup);
    this.logger.log(
      `Generating credentials named "preview" for branch "${db.branch}"`,
    );
    const dbCreds = await branch.forceCreateCredentials('preview');

    // Envoyer
    this.logger.log(`loading projects from Envoyer`);
    const projects = await this.envoyerService.listProjects();
    this.logger.log(`Checking for project named "${projectName}"`);
    let project = projects.find((project) => project.name === projectName);
    if (project != null) {
      this.logger.log(`project exists`);
    } else {
      this.logger.log(`Creating project ${projectName} for site ${siteName}`);
      project = await this.envoyerService.createProject(projectName, siteName);
    }

    this.logger.log(`loading servers for project ${project.id}`);
    const envoyerServers = await project.listServers();
    this.logger.log(`Checking for envoyer server with IP ${server.ipAddress}`);
    let envoyerServer = envoyerServers.find(
      (server) => server.ipAddress === server.ipAddress,
    );
    if (envoyerServer != null) {
      this.logger.log(`envoyer server exists`);
    } else {
      this.logger.log(`Creating server in Envoyer`);
      envoyerServer = await project.createServer('preview', site, phpVersion);
    }
    const sshKeyName = `Envoyer (${siteName})`;
    this.logger.log(`Checking for SSH key "${sshKeyName}" on forge server`);
    const sshKeys = await server.listKeys();
    let sshKey = sshKeys.find((key) => key.name === sshKeyName);
    if (sshKey != null) {
      this.logger.log('ssh key exists');
    } else {
      this.logger.log(`Creating ssh key on forge server`);
      sshKey = await server.createKey(
        sshKeyName,
        'forge',
        envoyerServer.publicKey,
      );
    }
    await sshKey.waitUntilReady();

    const env = this.createEnv(
      this.configService.getEnvironment(),
      site,
      database,
      dbCreds,
    );
    this.logger.log(
      `Pushing environment to server "${envoyerServer.name}" on Envoyer for site "${site.name}"`,
    );
    await envoyerServer.pushEnvironment(env);

    this.logger.log(`Deploying project ${project.name}`);
    await project.deploy();

    return {
      url: siteName,
    };
  }

  async destroyPreview(isMerge: true): Promise<MergeResult>;
  async destroyPreview(isMerge: false): Promise<undefined>;
  async destroyPreview(isMerge: boolean): Promise<MergeResult | undefined> {
    const projectName = this.getEnvoyerProjectName();
    this.logger.log(`Deleting Envoyer project "${projectName}"`);
    const projects = await this.envoyerService.listProjects();
    const project = projects.find((project) => project.name === projectName);
    if (project == null) {
      this.logger.log(`Project "${projectName}" not found. Skipping.`);
    } else {
      await project.delete();
    }

    // delete forge
    const server = await this.getForgeServer();
    const siteName = this.getSiteName();
    this.logger.log(`Deleting Forge site "${siteName}"`);
    const site = await server.findSite(siteName);
    if (site == null) {
      this.logger.log(`Site "${siteName} not found. Skipping.`);
    } else {
      await site.delete();
    }

    const db = await this.getPlanetScaleDatabase();
    const dbInfo = this.getDbInfo();
    this.logger.log(
      `Retrieving information on database branch ${dbInfo.branch}.`,
    );
    const branch = await db.getBranch(dbInfo.branch);
    this.logger.log(`Retrieving information on base branch ${dbInfo.base}.`);
    const baseBranch = await db.getBranch(dbInfo.base);
    this.logger.log(`Locating database backup ${dbInfo.backupName}`);
    const backups = await baseBranch.listBackups();
    const backup = backups.find((backup) => backup.name === dbInfo.backupName);
    if (backup == null) {
      this.logger.log(
        `No backup named ${dbInfo.backupName} was found. skipping.`,
      );
    } else {
      this.logger.log(`Deleting database backup ${dbInfo.backupName}`);
      await backup.delete();
    }

    if (isMerge) {
      this.logger.log(
        `Creating deployment request in PlanetScale to merge ${dbInfo.branch} into ${dbInfo.base}.`,
      );
      const deployRequest = await db.requestDeploy(branch, baseBranch);
      return {
        planetScaleRequestUrl: deployRequest.htmlUrl,
      };
    } else {
      this.logger.log(`Deleting database branch ${dbInfo.branch}.`);
      await branch.delete();
    }
  }
}

function titleCase(repoName: string): string {
  return repoName
    .split(/[-_]/)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function kebabCase(branchName: string): string {
  return branchName
    .split(/[-_]/)
    .map((part) => part.toLowerCase())
    .join('-');
}

function dbBranchName(
  branchName: string,
  branchMappings: Map<string, string>,
): string {
  if (branchMappings.has(branchName)) {
    return branchMappings.get(branchName);
  }
  return kebabCase(branchName);
}

function urlName(branchName: string): string {
  return kebabCase(branchName);
}
