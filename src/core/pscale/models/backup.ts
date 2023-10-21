import { PlanetScaleService } from '../pscale.service';
import { z } from 'zod';
import { Branch } from './branch';

export const backupSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export class Backup {
  public id: string;
  public name: string;

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
}
