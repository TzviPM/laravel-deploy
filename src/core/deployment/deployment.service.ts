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
    this.logger.debug(`Creating an environment for ${site.name}`);

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

  async createPreview() {
    const servers = this.configService.getServers();
    const { id: serverId, domain: domain } = servers[0];
    const pr = this.contextService.getPullRequest();
    const branchName = pr.branchName;
    const siteName = `${urlName(branchName)}.${domain}`;
    const baseProjectName =
      this.configService.getProjectName() || titleCase(pr.repo.name);
    const projectName = `${baseProjectName} Preview - ${titleCase(branchName)}`;
    const phpVersion = this.configService.getPhpVersion();

    const baseDbBranch = dbBranchName(pr.baseBranchName);
    const dbBranch = dbBranchName(branchName);
    const dbBackupName = baseDbBranch + '__' + dbBranch;

    // Forge
    this.logger.debug(`loading server with ID ${serverId}`);
    const server = await this.forgeService.getServer(serverId);

    this.logger.debug(`loading sites for server ${server.id}`);
    const sites = await server.loadSites();
    this.logger.debug(`Checking for site named ${siteName}`);
    let site = sites.find((site) => site.name === siteName);
    if (site != null) {
      this.logger.debug(`site exists`);
    } else {
      const databaseName = siteName.replace(/-/g, '_').replace(/[^\w_]/g, '');
      this.logger.debug(`Sanitized database name: '${databaseName}'`);

      this.logger.log(`Creating site ${siteName}`);
      site = await server.createSite(siteName, databaseName);
    }
    this.logger.debug(`Checking for SSL Certificate on forge`);
    const certs = await site.listCerts();
    let cert = certs.find((cert) => cert.domain === site.name);
    if (cert != null) {
      this.logger.debug('cert exists');
    } else {
      this.logger.log(`Creating certificate with LetsEncrypt`);
      cert = await site.createLetsEncryptCert();
    }
    await cert.waitUntilReady();

    // PlanetScale
    this.logger.debug(`loading database info for PlanetScale`);
    const orgName = this.configService.getPScaleOrganization();
    const dbName = this.configService.getPScaleDatabase();

    this.logger.debug(`loading organization "${orgName}" from PlanetScale`);
    const org = await this.pscaleService.getOrganization(orgName);
    this.logger.debug(
      `getting database "${dbName}" for organization "${orgName}"`,
    );
    const database = await org.getDatabase(dbName);

    this.logger.debug(`Getting base branch "${baseDbBranch}"`);
    const baseBranch = await database.getBranch(baseDbBranch);
    this.logger.debug(
      `Creating backup "${dbBackupName}" of branch "${baseDbBranch}"`,
    );
    const backup = await baseBranch.ensureBackup(dbBackupName);
    this.logger.debug(
      `Forking branch "${dbBranch}" from base branch "${baseDbBranch}"`,
    );
    const branch = await baseBranch.ensureForkBranch(dbBranch, backup);
    this.logger.debug(
      `Generating credentials named "preview" for branch "${dbBranch}"`,
    );
    const dbCreds = await branch.forceCreateCredentials('preview');

    // Envoyer
    this.logger.debug(`loading projects from Envoyer`);
    const projects = await this.envoyerService.listProjects();
    this.logger.debug(`Checking for project named "${projectName}"`);
    let project = projects.find((project) => project.name === projectName);
    if (project != null) {
      this.logger.debug(`project exists`);
    } else {
      this.logger.log(`Creating project ${projectName} for site ${siteName}`);
      project = await this.envoyerService.createProject(projectName, siteName);
    }

    this.logger.debug(`loading servers for project ${project.id}`);
    const envoyerServers = await project.listServers();
    this.logger.debug(
      `Checking for envoyer server with IP ${server.ipAddress}`,
    );
    let envoyerServer = envoyerServers.find(
      (server) => server.ipAddress === server.ipAddress,
    );
    if (envoyerServer != null) {
      this.logger.debug(`envoyer server exists`);
    } else {
      this.logger.log(`Creating server in Envoyer`);
      envoyerServer = await project.createServer('preview', site, phpVersion);
    }
    const sshKeyName = `Envoyer (${siteName})`;
    this.logger.debug(`Checking for SSH key "${sshKeyName}" on forge server`);
    const sshKeys = await server.listKeys();
    let sshKey = sshKeys.find((key) => key.name === sshKeyName);
    if (sshKey != null) {
      this.logger.debug('ssh key exists');
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
    this.logger.debug(
      `Pushing environment to server "${envoyerServer.name}" on Envoyer for site "${site.name}"`,
    );
    await envoyerServer.pushEnvironment(env);

    this.logger.debug(`Deploying project ${project.name}`);
    await project.deploy();
  }

  async destroyPreview() {}
}

function titleCase(repoName: string): string {
  return repoName
    .split(/[-_]/)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function dbBranchName(branchName: string): string {
  const branchParts = branchName.split(/[-_]/);

  return branchParts.map((part) => part.toLowerCase()).join('-');
}

function urlName(branchName: string): string {
  const branchParts = branchName.split(/[-_]/);

  return branchParts.map((part) => part.toLowerCase()).join('-');
}
