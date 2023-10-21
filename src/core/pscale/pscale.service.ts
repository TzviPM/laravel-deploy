import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { PreviewConfigService } from '../preview_config/preview_config.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, map } from 'rxjs';
import { z } from 'zod';
import { Organization, organizationSchema } from './models/organization';
import { Database, databaseSchema } from './models/database';
import { Branch, branchSchema } from './models/branch';
import { Backup, backupSchema } from './models/backup';
import { Credentials, credentialsSchema } from './models/credentials';

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

export const credentialResponseSchema = credentialsSchema;

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
        Authorization: `${this.tokenId}:${this.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
  }

  private get(path: string): Observable<AxiosResponse<unknown, any>> {
    return this.httpService.get(this.apiUrl(path), this.config());
  }

  private post(
    path: string,
    data: {},
  ): Observable<AxiosResponse<unknown, any>> {
    return this.httpService.post(this.apiUrl(path), data, this.config());
  }

  public listOrganizations(): Observable<Organization[]> {
    return this.get('organizations').pipe(
      map((data) => organizationsResponseSchema.parse(data)),
      map(({ data }) => data.map((org) => new Organization(this, org))),
    );
  }

  public getOrganization(id: string): Observable<Organization> {
    return this.get(`organizations/${id}`).pipe(
      map((data) => organizationResponseSchema.parse(data)),
      map((data) => new Organization(this, data)),
    );
  }

  public listDatabases(org: Organization): Observable<Database[]> {
    return this.get(`${org.path}/databases`).pipe(
      map((data) => databasesResponseSchema.parse(data)),
      map(({ data }) => data.map((db) => new Database(this, org, db))),
    );
  }

  public getDatabase(org: Organization, id: string): Observable<Database> {
    return this.get(`${org.path}/databases/${id}`).pipe(
      map((data) => databaseResponseSchema.parse(data)),
      map((data) => new Database(this, org, data)),
    );
  }

  public listBranches(db: Database): Observable<Branch[]> {
    return this.get(`${db.path}/branches`).pipe(
      map((data) => branchesResponseSchema.parse(data)),
      map(({ data }) => data.map((branch) => new Branch(this, db, branch))),
    );
  }

  public getBranch(db: Database, name: string): Observable<Branch> {
    return this.get(`${db.path}/branches/${name}`).pipe(
      map((data) => branchResponseSchema.parse(data)),
      map((data) => new Branch(this, db, data)),
    );
  }

  public createBranch(
    db: Database,
    parent: Branch,
    name: string,
    backup?: Backup,
  ): Observable<Branch> {
    return this.post(`${db.path}/branches`, {
      name,
      parent_branch: parent.name,
      backup_id: backup?.id,
    }).pipe(
      map((data) => branchResponseSchema.parse(data)),
      map((data) => new Branch(this, db, data)),
    );
  }

  public listBackups(branch: Branch): Observable<Backup[]> {
    return this.get(`${branch.path}/backups`).pipe(
      map((data) => backupsResponseSchema.parse(data)),
      map(({ data }) => data.map((backup) => new Backup(this, branch, backup))),
    );
  }

  public createBackup(branch: Branch, name: string): Observable<Backup> {
    return this.post(`${branch.path}/backups`, {
      name,
    }).pipe(
      map((data) => backupResponseSchema.parse(data)),
      map((data) => new Backup(this, branch, data)),
    );
  }

  public createCredentials(
    branch: Branch,
    name: string,
  ): Observable<Credentials> {
    return this.post(`${branch.path}/passwords`, {
      name,
    }).pipe(
      map((data) => credentialResponseSchema.parse(data)),
      map((data) => new Credentials(this, branch, data)),
    );
  }
}
