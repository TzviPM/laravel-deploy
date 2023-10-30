import { z } from 'zod';
import { Project } from './project';
import { EnvoyerService } from '../envoyer.service';

export const serverSchema = z.object({
  id: z.number(),
  name: z.string(),
  ip_address: z.string(),
  port: z.string(),
  deployment_path: z.string(),
  public_key: z.string(),
});

export class Server {
  public id: number;
  public name: string;
  public ipAddress: string;
  public port: string;
  public deploymentPath: string;
  publicKey: string;

  constructor(
    private readonly envoyerService: EnvoyerService,
    public readonly project: Project,
    data: z.infer<typeof serverSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.ipAddress = data.ip_address;
    this.port = data.port;
    this.deploymentPath = data.deployment_path;
    this.publicKey = data.public_key;
  }

  pushEnvironment(contents: string): Promise<void> {
    return this.envoyerService.pushEnvironment(this.project, this, contents);
  }
}
