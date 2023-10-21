import { ForgeService } from '../forge.service';
import { z } from 'zod';

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

  loadSites() {
    return this.forgeService.listSites(this);
  }

  createSite(siteName: string, databaseName: string) {
    return this.forgeService.createSite(this, siteName, databaseName);
  }
}
