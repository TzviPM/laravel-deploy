import { PlanetScaleService } from '../pscale.service';
import { z } from 'zod';
import { Branch } from './branch';

export const backupSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.string(),
});

export class Backup {
  public id: string;
  public name: string;
  public state: string;

  public get path() {
    return `${this.branch.path}/backups/${this.id}`;
  }

  constructor(
    private readonly pscaleService: PlanetScaleService,
    private readonly branch: Branch,
    data: z.infer<typeof backupSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
  }

  private async refetch() {
    const backup = await this.branch.getBackup(this.id);
    this.state = backup.state;
  }

  public async waitUntilReady(): Promise<void> {
    while (['pending', 'running'].includes(this.state)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.refetch();
    }
  }

  public async delete(): Promise<void> {
    return this.pscaleService.deleteBackup(this);
  }
}
