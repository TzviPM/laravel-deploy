import { PlanetScaleService } from '../pscale.service';
import { string, z } from 'zod';
import { Database } from './database';
import { Backup } from './backup';
import { Observable } from 'rxjs';
import { Credentials } from './credentials';

export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
  production: z.boolean(),
});

export enum BranchType {
  Production,
  Development,
}

export class Branch {
  public id: string;
  public name: string;
  public type: BranchType;

  public get path() {
    return `${this.database.path}/branches/${this.id}`;
  }

  constructor(
    private readonly pscaleService: PlanetScaleService,
    private readonly database: Database,
    data: z.infer<typeof branchSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.production
      ? BranchType.Production
      : BranchType.Development;
  }

  forkBranch(name: string, backup?: Backup): Observable<Branch> {
    return this.database.createBranch(this, name, backup);
  }

  listBackups(): Observable<Backup[]> {
    return this.pscaleService.listBackups(this);
  }

  createBackup(name: string): Observable<Backup> {
    return this.pscaleService.createBackup(this, name);
  }

  createCredentials(name: string): Observable<Credentials> {
    return this.pscaleService.createCredentials(this, name);
  }
}
