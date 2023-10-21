import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { PreviewConfigService } from '../preview_config/preview_config.service';
import { Axios, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, map, pluck } from 'rxjs';
import { z } from 'zod';
import { Server, serverSchema } from './models/server';
import { Site, siteSchema } from './models/site';

export const serverResponseSchema = z.object({
  server: serverSchema,
});

export const sitesResponseSchema = z.object({
  sites: z.array(siteSchema),
});

export const siteResponseSchema = z.object({
  site: siteSchema,
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

  private get(path: string): Observable<AxiosResponse<unknown, any>> {
    return this.httpService.get(this.apiUrl(path), this.config());
  }

  private post(
    path: string,
    data: {},
  ): Observable<AxiosResponse<unknown, any>> {
    return this.httpService.post(this.apiUrl(path), data, this.config());
  }

  public getServer(id: number): Observable<Server> {
    return this.get(`servers/${id}`).pipe(
      map((s) => serverResponseSchema.parse(s?.data)),
      map((s) => new Server(this, s.server)),
    );
  }

  public listSites(server: Server): Observable<Site[]> {
    return this.get(`servers/${server.id}/sites`).pipe(
      map((s) => sitesResponseSchema.parse(s?.data)),
      map((s) => s.sites.map((site) => new Site(server, site))),
    );
  }

  public createSite(
    server: Server,
    domain: string,
    database: string,
  ): Observable<Site> {
    return this.post(`servers/${server.id}/sites`, {
      domain,
      project_type: 'php',
      database,
      directory: '/current/public',
    }).pipe(
      map((s) => siteResponseSchema.parse(s?.data)),
      map((s) => new Site(server, s.site)),
    );
  }
}
