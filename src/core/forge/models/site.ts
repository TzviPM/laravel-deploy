import { z } from 'zod';
import { Server } from './server';
import { ForgeService } from '../forge.service';
import { Certificate } from './certificate';

export const siteSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string().nullable(),
  username: z.string(),
  directory: z.string(),
});

export class Site {
  public id: number;
  public name: string;
  public status: string | null;
  public username: string;
  public directory: string;

  constructor(
    private readonly forgeService: ForgeService,
    public readonly server: Server,
    data: z.infer<typeof siteSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.status = data.status;
    this.username = data.username;
    this.directory = data.directory;
  }

  get apiPath(): string {
    return `${this.server.apiPath}/sites/${this.id}`;
  }

  listCerts(): Promise<Certificate[]> {
    return this.forgeService.listCerts(this);
  }

  getCert(id: string): Promise<Certificate> {
    return this.forgeService.getCert(this, id);
  }

  createLetsEncryptCert(): Promise<Certificate> {
    return this.forgeService.createLetsEncryptCert(this);
  }
}
