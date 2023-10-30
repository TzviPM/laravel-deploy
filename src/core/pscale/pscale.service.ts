import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { PreviewConfigService } from '../preview_config/preview_config.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';
import { Organization, organizationSchema } from './models/organization';
import { Database, databaseSchema } from './models/database';
import { Branch, branchSchema } from './models/branch';
import { Backup, backupSchema } from './models/backup';
import { Credentials, credentialsSchema } from './models/credentials';
import { AGENT_NAME } from '../agent';
import { DeployRequest, deployRequestSchema } from './models/deploy_request';

export const organizationsResponseSchema = z.object({
  data: z.array(organizationSchema),
});

export const organizationResponseSchema = organizationSchema;

export const databasesResponseSchema = z.object({
  data: z.array(databaseSchema),
});

export const databaseResponseSchema = databaseSchema;

export const branchesResponseSchema = z.object({
  data: z.array(branchSchema),
});

export const branchResponseSchema = branchSchema;

export const backupsResponseSchema = z.object({
  data: z.array(backupSchema),
});

export const backupResponseSchema = backupSchema;

export const credentialsResponseSchema = z.object({
  data: z.array(credentialsSchema),
});

export const credentialResponseSchema = credentialsSchema;

export const deployRequestResponseSchema = deployRequestSchema;

@Injectable()
export class PlanetScaleService {
  private static baseUrl = 'https://api.planetscale.com/v1';
  private readonly logger = new Logger(PlanetScaleService.name);

  private tokenId: string;
  private token: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: PreviewConfigService,
  ) {
    const { id, token } = this.configService.getPScaleToken();

    this.tokenId = id;
    this.token = token;
  }

  private apiUrl(path: string): string {
    return `${PlanetScaleService.baseUrl}/${path}`;
  }

  private config(): AxiosRequestConfig {
    return {
      headers: {
        'User-Agent': AGENT_NAME,
        Authorization: `${this.tokenId}:${this.token}`,
        accept: 'application/json',
        'content-type': 'application/json',
      },
    };
  }

  private async get(path: string): Promise<AxiosResponse<unknown, any>> {
    this.logger.debug(`GET ${this.apiUrl(path)}`);
    return firstValueFrom(
      this.httpService.get(this.apiUrl(path), this.config()),
    );
  }

  private async post(
    path: string,
    data: {},
  ): Promise<AxiosResponse<unknown, any>> {
    this.logger.debug(`POST ${this.apiUrl(path)} ${JSON.stringify(data)}`);
    return firstValueFrom(
      this.httpService.post(this.apiUrl(path), data, this.config()),
    );
  }

  private async delete(path: string): Promise<AxiosResponse<unknown, any>> {
    this.logger.debug(`DELETE ${this.apiUrl(path)}`);
    return firstValueFrom(
      this.httpService.delete(this.apiUrl(path), this.config()),
    );
  }

  public async listOrganizations(): Promise<Organization[]> {
    const raw = await this.get('organizations');
    const res = organizationsResponseSchema.parse(raw?.data);
    return res.data.map((org) => new Organization(this, org));
  }

  public async getOrganization(id: string): Promise<Organization> {
    const raw = await this.get(`organizations/${id}`);
    const res = organizationResponseSchema.parse(raw?.data);
    return new Organization(this, res);
  }

  public async listDatabases(org: Organization): Promise<Database[]> {
    const raw = await this.get(`${org.path}/databases`);
    const res = databasesResponseSchema.parse(raw?.data);
    return res.data.map((db) => new Database(this, org, db));
  }

  public async getDatabase(org: Organization, id: string): Promise<Database> {
    const raw = await this.get(`${org.path}/databases/${id}`);
    const res = databaseResponseSchema.parse(raw?.data);
    return new Database(this, org, res);
  }

  public async listBranches(db: Database): Promise<Branch[]> {
    const raw = await this.get(`${db.path}/branches`);
    const res = branchesResponseSchema.parse(raw?.data);
    return res.data.map((branch) => new Branch(this, db, branch));
  }

  public async getBranch(db: Database, name: string): Promise<Branch> {
    const raw = await this.get(`${db.path}/branches/${name}`);
    const res = branchResponseSchema.parse(raw?.data);
    return new Branch(this, db, res);
  }

  public async createBranch(
    db: Database,
    parent: Branch,
    name: string,
    backup?: Backup,
  ): Promise<Branch> {
    const raw = await this.post(`${db.path}/branches`, {
      name,
      parent_branch: parent.name,
      backup_id: backup?.id,
    });
    const res = branchResponseSchema.parse(raw?.data);
    return new Branch(this, db, res);
  }

  public async deleteBranch(branch: Branch): Promise<void> {
    await this.delete(branch.path);
  }

  public async listBackups(branch: Branch): Promise<Backup[]> {
    const raw = await this.get(`${branch.path}/backups`);
    const res = backupsResponseSchema.parse(raw?.data);
    return res.data.map((backup) => new Backup(this, branch, backup));
  }

  public async getBackup(branch: Branch, name: string): Promise<Backup> {
    const raw = await this.get(`${branch.path}/backups/${name}`);
    const res = backupResponseSchema.parse(raw?.data);
    return new Backup(this, branch, res);
  }

  public async createBackup(branch: Branch, name: string): Promise<Backup> {
    const raw = await this.post(`${branch.path}/backups`, {
      name,
    });
    const res = backupResponseSchema.parse(raw?.data);
    return new Backup(this, branch, res);
  }

  public async listCredentials(branch: Branch): Promise<Credentials[]> {
    const raw = await this.get(`${branch.path}/passwords`);
    const res = credentialsResponseSchema.parse(raw?.data);
    return res.data.map(
      (credential) => new Credentials(this, branch, credential),
    );
  }

  public async createCredentials(
    branch: Branch,
    name: string,
  ): Promise<Credentials> {
    const raw = await this.post(`${branch.path}/passwords`, {
      name,
    });
    const res = credentialResponseSchema.parse(raw?.data);
    return new Credentials(this, branch, res);
  }

  public async updateCredentials(
    branch: Branch,
    credentials: Credentials,
  ): Promise<Credentials> {
    await this.delete(`${credentials.path}`);
    return this.createCredentials(branch, credentials.name);
  }

  public async requestDeploy(
    database: Database,
    from: Branch,
    into: Branch,
  ): Promise<DeployRequest> {
    const raw = await this.post(`${database.path}/deploy-requests`, {
      branch: from,
      into_branch: into,
      notes: `Initiated via ${AGENT_NAME}`,
    });
    const res = deployRequestResponseSchema.parse(raw);
    return new DeployRequest(database, res);
  }
}
