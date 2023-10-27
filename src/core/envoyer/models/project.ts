import { z } from 'zod';
import { EnvoyerService } from '../envoyer.service';
import { Site } from 'src/core/forge/models/site';
import { Server } from './server';

export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  provider: z.string(),
  plain_repository: z.string(),
  branch: z.string(),
});

export class Project {
  public id: number;
  public name: string;
  public provider: string;
  public plainRepository: string;
  public branch: string;

  constructor(
    private envoyerService: EnvoyerService,
    data: z.infer<typeof projectSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.provider = data.provider;
    this.plainRepository = data.plain_repository;
    this.branch = data.branch;
  }

  public deploy(): Promise<void> {
    return this.envoyerService.deployProject(this.id, this.branch);
  }

  public listServers(): Promise<Server[]> {
    return this.envoyerService.listServers(this);
  }

  public createServer(
    name: string,
    site: Site,
    phpVersion: string,
  ): Promise<Server> {
    return this.envoyerService.createServer(this, name, site, phpVersion);
  }
}
