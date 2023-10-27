import { ForgeService } from '../forge.service';
import { z } from 'zod';
import { Site } from './site';
import { SshKey } from './ssh_key';
import { Certificate } from './certificate';

export const serverSchema = z.object({
  id: z.number(),
  name: z.string(),
  ip_address: z.string().ip(),
});

export class Server {
  public id: number;
  public name: string;
  public ipAddress: string;

  constructor(
    private forgeService: ForgeService,
    data: z.infer<typeof serverSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.ipAddress = data.ip_address;
  }

  get apiPath(): string {
    return `servers/${this.id}`;
  }

  loadSites(): Promise<Site[]> {
    return this.forgeService.listSites(this);
  }

  createSite(siteName: string, databaseName: string): Promise<Site> {
    return this.forgeService.createSite(this, siteName, databaseName);
  }

  listKeys(): Promise<SshKey[]> {
    return this.forgeService.listKeys(this);
  }

  getKey(id: string): Promise<SshKey> {
    return this.forgeService.getKey(this, id);
  }

  createKey(name: string, username: string, key: string): Promise<SshKey> {
    return this.forgeService.createKey(this, name, username, key);
  }
}
