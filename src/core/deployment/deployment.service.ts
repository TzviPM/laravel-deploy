import { Injectable, Logger } from '@nestjs/common';
import { PreviewConfigService } from '../preview_config/preview_config.service';
import { ForgeService } from '../forge/forge.service';
import {
  filter,
  firstValueFrom,
  merge,
  map,
  mergeMap,
  zip,
  Observable,
} from 'rxjs';
import { ContextService } from 'src/github/context/context.service';
import { EnvoyerService } from '../envoyer/envoyer.service';
import { Server as ForgeServer } from '../forge/models/server';
import { Site } from '../forge/models/site';
import { Project } from '../envoyer/models/project';
import { Server as EnvoyerServer } from '../envoyer/models/server';
import { Database } from '../pscale/models/database';
import { PlanetScaleService } from '../pscale/pscale.service';
import { string } from 'zod';
import { Branch } from '../pscale/models/branch';
import { Backup } from '../pscale/models/backup';
import { Credentials } from '../pscale/models/credentials';

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

  private forgeServer$(id: number): Observable<ForgeServer> {
    this.logger.debug(`loading server with ID ${id}`);

    return this.forgeService.getServer(id);
  }

  private site$(
    forgeServer$: Observable<ForgeServer>,
    siteName: string,
  ): Observable<Site> {
    const maybeSite$ = forgeServer$.pipe(
      mergeMap((server) => {
        this.logger.debug(`loading sites for server ${server.id}`);
        return server.loadSites();
      }),
      map((sites) => {
        this.logger.debug(`Checking for site named ${siteName}`);
        return sites.find((site) => site.name === siteName);
      }),
    );

    const existingSite$ = maybeSite$.pipe(
      filter((site) => !!site),
      map((site) => {
        this.logger.debug(`site exists`);
        return site;
      }),
    );

    const noSite$ = maybeSite$.pipe(filter((site) => !site));

    const newSite$ = zip(forgeServer$, noSite$).pipe(
      map(([server, _]) => server),
      mergeMap((server) => {
        const databaseName = siteName.replace(/-/g, '_').replace(/[^\w_]/g, '');
        this.logger.debug(`Sanitized database name: '${databaseName}'`);

        this.logger.log(`Creating site ${siteName}`);
        return server.createSite(siteName, databaseName);
      }),
    );

    return merge(existingSite$, newSite$);
  }

  private project$(name: string, siteName: string): Observable<Project> {
    this.logger.debug(`loading projects from Envoyer`);

    const maybeProject$ = this.envoyerService.listProjects().pipe(
      map((projects) => {
        this.logger.debug(`Checking for project named "${name}"`);
        return projects.find((project) => project.name === name);
      }),
    );

    const existingProject$ = maybeProject$.pipe(
      filter((project) => !!project),
      map((project) => {
        this.logger.debug(`project exists`);
        return project;
      }),
    );

    const newProject$ = maybeProject$.pipe(
      filter((project) => !project),
      mergeMap(() => {
        this.logger.log(`Creating project ${name}`);
        return this.envoyerService.createProject(name, siteName);
      }),
    );

    return merge(existingProject$, newProject$);
  }

  private envoyerServer$(
    project$: Observable<Project>,
    server$: Observable<ForgeServer>,
    site$: Observable<Site>,
  ): Observable<EnvoyerServer> {
    const envoyerServers$ = project$.pipe(
      mergeMap((project) => {
        this.logger.debug(`loading servers for project ${project.id}`);
        return project.listServers();
      }),
    );

    const maybeEnvoyerServer$ = zip(envoyerServers$, server$).pipe(
      map(([servers, forgeServer]) => {
        this.logger.debug(
          `Checking for envoyer server with IP ${forgeServer.ipAddress}`,
        );
        return servers.find(
          (server) => server.ipAddress === forgeServer.ipAddress,
        );
      }),
    );

    const existingEnvoyerServer$ = maybeEnvoyerServer$.pipe(
      filter((server) => !!server),
      map((server) => {
        this.logger.debug(`envoyer server exists`);
        return server;
      }),
    );

    const newEnvoyerServer$ = maybeEnvoyerServer$.pipe(
      filter((server) => !server),
      mergeMap(() => {
        this.logger.log(`Creating server in Envoyer`);
        return zip(project$, site$).pipe(
          mergeMap(([project, site]) => {
            return project.createServer('preview', site);
          }),
        );
      }),
    );

    return merge(existingEnvoyerServer$, newEnvoyerServer$);
  }

  private database$(): Observable<Database> {
    this.logger.debug(`loading database from PlanetScale`);

    const orgId = this.configService.getPScaleOrganization();
    const dbId = this.configService.getPScaleDatabase();

    return this.pscaleService
      .getOrganization(orgId)
      .pipe(mergeMap((org) => org.getDatabase(dbId)));
  }

  private baseBranch$(
    database$: Observable<Database>,
    baseDbBranch: string,
  ): Observable<Branch> {
    return database$.pipe(
      mergeMap((db) => {
        this.logger.debug(`Getting base branch ${baseDbBranch}`);
        return db.getBranch(baseDbBranch);
      }),
    );
  }

  private branch$(
    baseBranch$: Observable<Branch>,
    name: string,
    backup$: Observable<Backup>,
  ): Observable<Branch> {
    return zip(baseBranch$, backup$).pipe(
      mergeMap(([baseBranch, backup]) => {
        this.logger.debug(
          `Creating new branch ${name} from ${baseBranch.name} using backup ${backup.name}`,
        );
        return baseBranch.forkBranch(name, backup);
      }),
    );
  }

  private dbCreds$(branch$: Observable<Branch>) {
    return branch$.pipe(
      mergeMap((branch) => {
        this.logger.debug(`Generating credentials for ${branch.name}`);
        return branch.createCredentials('preview');
      }),
    );
  }

  private backup$(
    baseBranch$: Observable<Branch>,
    name: string,
  ): Observable<Backup> {
    return baseBranch$.pipe(
      mergeMap((branch) => {
        this.logger.debug(
          `Creating a backup (${name}) of branch ${branch.name}`,
        );
        return branch.createBackup(name);
      }),
    );
  }

  private createEnv(
    baseEnv: string,
    site: Site,
    database: Database,
    creds: Credentials,
  ) {
    this.logger.debug(`Creating an environment for ${site.name}`);

    return `${baseEnv}
    APP_URL=${site.name}
    
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
    const siteName = `${branchName}.${domain}`;
    const baseProjectName =
      this.configService.getProjectName() || titleCase(pr.repo.name);
    const projectName = `${baseProjectName} Preview - ${titleCase(branchName)}`;

    const baseDbBranch = dbBranchName(pr.repo.name, pr.baseBranchName);
    const dbBranch = dbBranchName(pr.repo.name, branchName);
    const dbBackupName = baseDbBranch + '__' + dbBranch;

    // Forge
    const server$ = this.forgeServer$(serverId);
    const site$ = this.site$(server$, siteName);

    // PlanetScale
    const database$ = this.database$();
    const baseBranch$ = this.baseBranch$(database$, baseDbBranch);
    const backup$ = this.backup$(baseBranch$, dbBackupName);
    const branch$ = this.branch$(baseBranch$, dbBranch, backup$);
    const dbCreds$ = this.dbCreds$(branch$);

    // Envoyer
    const project$ = this.project$(projectName, siteName);
    const envoyerServer$ = this.envoyerServer$(project$, server$, site$);

    const env$ = zip(envoyerServer$, site$, database$, dbCreds$).pipe(
      mergeMap(([envoyerServer, site, database, creds]) => {
        const env = this.createEnv(
          this.configService.getEnvironment(),
          site,
          database,
          creds,
        );
        this.logger.debug(
          `Pushing environment to server "${envoyerServer.name}" on Envoyer for site "${site.name}"`,
        );
        return envoyerServer.pushEnvironment(env);
      }),
    );

    const deploy$ = zip(project$, env$).pipe(
      mergeMap(([project, _]) => {
        this.logger.debug(`Deploying project ${project.name}`);
        return project.deploy();
      }),
    );

    await firstValueFrom(deploy$);
  }

  async destroyPreview() {}
}

function titleCase(repoName: string): string {
  return repoName
    .split(/[-_]/)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function dbBranchName(repoName: string, branchName: string): string {
  const repoParts = repoName.split(/[-_]/);
  const branchParts = branchName.split(/[-_]/);

  return [...repoParts, ...branchParts]
    .map((part) => part.toLowerCase())
    .join('_');
}
