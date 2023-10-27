import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { PreviewConfigService } from '../preview_config/preview_config.service';
import { Axios, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, firstValueFrom, map, pluck } from 'rxjs';
import { z } from 'zod';
import { Server, serverSchema } from './models/server';
import { Site, siteSchema } from './models/site';
import { SshKey, sshKeySchema } from './models/ssh_key';
import { Certificate, certificateSchema } from './models/certificate';

export const serverResponseSchema = z.object({
  server: serverSchema,
});

export const sitesResponseSchema = z.object({
  sites: z.array(siteSchema),
});

export const siteResponseSchema = z.object({
  site: siteSchema,
});

export const keysResponseSchema = z.object({
  keys: z.array(sshKeySchema),
});

export const keyResponseSchema = z.object({
  key: sshKeySchema,
});

export const certificatesResponseSchema = z.object({
  certificates: z.array(certificateSchema),
});

export const certificateResponseSchema = z.object({
  certificate: certificateSchema,
});

@Injectable()
export class ForgeService {
  private static baseUrl = 'https://forge.laravel.com/api/v1';
  private readonly logger = new Logger(ForgeService.name);

  private token: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: PreviewConfigService,
  ) {
    this.token = this.configService.getForgeToken();
  }

  private apiUrl(path: string): string {
    return `${ForgeService.baseUrl}/${path}`;
  }

  private config(): AxiosRequestConfig {
    return {
      headers: {
        'User-Agent': 'TzviPM/laravel-deploy@v1',
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
  }

  private async get(path: string): Promise<AxiosResponse<unknown, any>> {
    this.logger.debug(`GET ${this.apiUrl(path)}`);
    return firstValueFrom(
      this.httpService.get(this.apiUrl(path), this.config()),
    );
  }

  private post(path: string, data: {}): Promise<AxiosResponse<unknown, any>> {
    this.logger.debug(`POST ${this.apiUrl(path)} ${JSON.stringify(data)}`);
    return firstValueFrom(
      this.httpService.post(this.apiUrl(path), data, this.config()),
    );
  }

  public async getServer(id: number): Promise<Server> {
    const raw = await this.get(`servers/${id}`);
    const res = serverResponseSchema.parse(raw?.data);
    return new Server(this, res.server);
  }

  public async listSites(server: Server): Promise<Site[]> {
    const raw = await this.get(`servers/${server.id}/sites`);
    const res = sitesResponseSchema.parse(raw?.data);
    return res.sites.map((site) => new Site(this, server, site));
  }

  public async createSite(
    server: Server,
    domain: string,
    database: string,
  ): Promise<Site> {
    const raw = await this.post(`servers/${server.id}/sites`, {
      domain,
      project_type: 'php',
      database,
      directory: '/current/public',
    });
    const res = siteResponseSchema.parse(raw?.data);
    return new Site(this, server, res.site);
  }

  public async listCerts(site: Site): Promise<Certificate[]> {
    const raw = await this.get(`${site.apiPath}/certificates`);
    const res = certificatesResponseSchema.parse(raw?.data);
    return res.certificates.map((cert) => new Certificate(site, cert));
  }

  public async getCert(site: Site, id: string): Promise<Certificate> {
    const raw = await this.get(`${site.apiPath}/certificates/${id}`);
    const res = certificateResponseSchema.parse(raw?.data);
    return new Certificate(site, res.certificate);
  }

  public async createLetsEncryptCert(site: Site): Promise<Certificate> {
    const raw = await this.post(`${site.apiPath}/certificates/letsencrypt`, {
      domains: [site.name],
    });
    const res = certificateResponseSchema.parse(raw?.data);
    return new Certificate(site, res.certificate);
  }

  public async listKeys(server: Server): Promise<SshKey[]> {
    const raw = await this.get(`servers/${server.id}/keys`);
    const res = keysResponseSchema.parse(raw?.data);
    return res.keys.map((key) => new SshKey(server, key));
  }

  public async getKey(server: Server, id: string): Promise<SshKey> {
    const raw = await this.get(`servers/${server.id}/keys/${id}`);
    const res = keyResponseSchema.parse(raw?.data);
    return new SshKey(server, res.key);
  }

  public async createKey(
    server: Server,
    name: string,
    username: string,
    key: string,
  ): Promise<SshKey> {
    const raw = await this.post(`servers/${server.id}/keys`, {
      name,
      username,
      key,
    });
    const res = keyResponseSchema.parse(raw?.data);
    return new SshKey(server, res.key);
  }
}
