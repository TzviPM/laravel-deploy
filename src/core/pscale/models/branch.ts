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
    return `${this.database.path}/branches/${this.name}`;
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

  forkBranch(name: string, backup?: Backup): Promise<Branch> {
    return this.database.createBranch(this, name, backup);
  }

  async ensureForkBranch(name: string, backup?: Backup): Promise<Branch> {
    const branches = await this.database.listBranches();
    const branch = branches.find((branch) => branch.name === name);
    if (branch) {
      return branch;
    }
    return this.forkBranch(name, backup);
  }

  listBackups(): Promise<Backup[]> {
    return this.pscaleService.listBackups(this);
  }

  createBackup(name: string): Promise<Backup> {
    return this.pscaleService.createBackup(this, name);
  }

  async ensureBackup(name: string): Promise<Backup> {
    const backups = await this.listBackups();
    const backup = backups.find((backup) => backup.name === name);
    if (backup) {
      return backup;
    }
    return this.createBackup(name);
  }

  createCredentials(name: string): Promise<Credentials> {
    return this.pscaleService.createCredentials(this, name);
  }

  async forceCreateCredentials(name: string): Promise<Credentials> {
    const creds = await this.pscaleService.listCredentials(this);
    const cred = creds.find((credential) => credential.name === name);
    if (cred) {
      return this.pscaleService.updateCredentials(this, cred);
    }
    return this.createCredentials(name);
  }
}
