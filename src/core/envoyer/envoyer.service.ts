import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { PreviewConfigService } from '../preview_config/preview_config.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  Observable,
  firstValueFrom,
  ignoreElements,
  map,
  mergeMap,
  pluck,
} from 'rxjs';
import { z } from 'zod';
import { Project, projectSchema } from './models/project';
import { ContextService } from 'src/github/context/context.service';
import { v5 as uuidv5 } from 'uuid';
import { Server, serverSchema } from './models/server';
import { Site } from '../forge/models/site';
import { ErrorHandler } from 'src/errors/handler';
import { AGENT_NAME } from '../agent';

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
        'User-Agent': AGENT_NAME,
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

  private async post(
    path: string,
    data: {},
  ): Promise<AxiosResponse<unknown, any>> {
    this.logger.debug(`POST ${this.apiUrl(path)} ${JSON.stringify(data)}`);
    return firstValueFrom(
      this.httpService.post(this.apiUrl(path), data, this.config()),
    );
  }

  private async put(
    path: string,
    data: {},
  ): Promise<AxiosResponse<unknown, any>> {
    this.logger.debug(`PUT ${this.apiUrl(path)} ${JSON.stringify(data)}`);
    return firstValueFrom(
      this.httpService.put(this.apiUrl(path), data, this.config()),
    );
  }

  private async delete(
    path: string,
    data: {},
  ): Promise<AxiosResponse<unknown, any>> {
    this.logger.debug(`DELETE ${this.apiUrl(path)} ${JSON.stringify(data)}`);
    return firstValueFrom(
      this.httpService.delete(this.apiUrl(path), {
        ...this.config(),
        data,
      }),
    );
  }

  public async listProjects(): Promise<Project[]> {
    const raw = await this.get(`projects`);
    const res = projectsResponseSchema.parse(raw?.data);
    return res.projects.map((project) => new Project(this, project));
  }

  public async createProject(name: string, domain: string): Promise<Project> {
    const pr = this.contextService.getPullRequest();
    const raw = await this.post(`projects`, {
      name,
      provider: 'github',
      repository: pr.repo.fullName,
      branch: pr.branchName,
      type: 'laravel-5',
      retain_deployments: 5,
      monitor: `https://${domain}`,
      composer: true,
      composer_dev: false,
      composer_quiet: false,
      push_to_deploy: true,
    });
    const res = projectResponseSchema.parse(raw?.data);
    return new Project(this, res.project);
  }

  public async deployProject(project: Project, branch: string): Promise<void> {
    await this.post(`${project.apiPath}/deployments`, {
      from: 'branch',
      branch,
    });
  }

  public async deleteProject(project: Project): Promise<void> {
    await this.delete(project.apiPath, {});
  }

  public async listServers(project: Project): Promise<Server[]> {
    const raw = await this.get(`${project.apiPath}/servers`);
    const res = serversResponseSchema.parse(raw?.data);
    return res.servers.map((server) => new Server(this, project, server));
  }

  public async createServer(
    project: Project,
    name: string,
    site: Site,
    phpVersion: string,
  ): Promise<Server> {
    const raw = await this.post(`${project.apiPath}/servers`, {
      name,
      connectAs: site.username,
      host: site.server.ipAddress,
      port: 22,
      receivesCodeDeployments: true,
      deploymentPath: `/home/${site.username}/${site.name}`,
      phpVersion,
    });
    const res = serverResponseSchema.parse(raw?.data);
    return new Server(this, project, res.server);
  }

  public async pushEnvironment(
    project: Project,
    server: Server,
    contents: string,
  ): Promise<void> {
    const key = uuidv5(EnvoyerService.repoUrl, uuidv5.URL);
    await this.delete(`${project.apiPath}/environment`, {
      key,
    });
    await this.put(`${project.apiPath}/environment`, {
      key,
      contents,
      servers: [server.id],
    });
  }
}
