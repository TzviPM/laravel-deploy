import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { PreviewConfigService } from '../preview_config/preview_config.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, ignoreElements, map, mergeMap, pluck } from 'rxjs';
import { z } from 'zod';
import { Project, projectSchema } from './models/project';
import { ContextService } from 'src/github/context/context.service';
import { v5 as uuidv5 } from 'uuid';
import { Server, serverSchema } from './models/server';
import { Site } from '../forge/models/site';

export const projectsResponseSchema = z.object({
  projects: z.array(projectSchema),
});

export const projectResponseSchema = z.object({
  project: projectSchema,
});

export const serversResponseSchema = z.object({
  servers: z.array(serverSchema),
});

export const serverResponseSchema = z.object({
  server: serverSchema,
});

@Injectable()
export class EnvoyerService {
  private static baseUrl = 'https://envoyer.io/api';
  private static repoUrl = 'https://github.com/TzviPM/laravel-deploy.git';
  private readonly logger = new Logger(EnvoyerService.name);

  private token: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: PreviewConfigService,
    private readonly contextService: ContextService,
  ) {
    this.token = this.configService.getEnvoyerToken();
  }

  private apiUrl(path: string): string {
    return `${EnvoyerService.baseUrl}/${path}`;
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

  private put(path: string, data: {}): Observable<AxiosResponse<unknown, any>> {
    return this.httpService.put(this.apiUrl(path), data, this.config());
  }

  private delete(
    path: string,
    data: {},
  ): Observable<AxiosResponse<unknown, any>> {
    return this.httpService.post(this.apiUrl(path), data, {
      ...this.config(),
      method: 'DELETE',
    });
  }

  public listProjects(): Observable<Project[]> {
    return this.get(`projects`).pipe(
      map((s) => projectsResponseSchema.parse(s?.data)),
      map((s) => s.projects.map((project) => new Project(this, project))),
    );
  }

  public createProject(name: string, domain: string): Observable<Project> {
    const pr = this.contextService.getPullRequest();

    return this.post(`projects`, {
      name,
      provider: 'github',
      repository: pr.repo.fullName,
      branch: pr.branchName,
      type: 'laravel-5',
      retain_deployments: 5,
      monitor: domain,
      composer: true,
      composer_dev: false,
      composer_quiet: false,
      push_to_deploy: true,
    }).pipe(
      map((s) => projectResponseSchema.parse(s?.data)),
      map((s) => new Project(this, s.project)),
    );
  }

  public deployProject(projectId: number, branch: string): Observable<void> {
    return this.post(`projects/${projectId}/deployments`, {
      from: 'branch',
      branch,
    }).pipe(ignoreElements());
  }

  public listServers(project: Project): Observable<Server[]> {
    return this.get(`projects/${project.id}/servers`).pipe(
      map((s) => serversResponseSchema.parse(s?.data)),
      map((s) => s.servers.map((server) => new Server(this, project, server))),
    );
  }

  public createServer(
    project: Project,
    name: string,
    site: Site,
  ): Observable<Server> {
    return this.post(`projects/${project.id}/servers`, {
      name,
      connectAs: site.username,
      host: site.server.ipAddress,
      port: 22,
      receivesCodeDeployments: true,
      deploymentPath: `/home/${site.username}/${site.name}`,
    }).pipe(
      map((s) => serverResponseSchema.parse(s?.data)),
      map((s) => new Server(this, project, s.server)),
    );
  }

  public pushEnvironment(
    projectId: number,
    serverId: number,
    contents: string,
  ): Observable<void> {
    const key = uuidv5(EnvoyerService.repoUrl, uuidv5.URL);
    return this.delete(`projects/${projectId}/environment`, { key }).pipe(
      mergeMap(() => {
        return this.put(`projects/${projectId}/environment`, {
          key,
          contents,
          servers: [serverId],
        });
      }),
      ignoreElements(),
    );
  }
}
