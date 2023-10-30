import { PlanetScaleService } from '../pscale.service';
import { z } from 'zod';
import { Organization } from './organization';
import { Branch } from './branch';
import { Backup } from './backup';
import { Observable } from 'rxjs';
import { DeployRequest } from './deploy_request';

export const databaseSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export class Database {
  public id: string;
  public name: string;

  public get path() {
    return `${this.organization.path}/databases/${this.name}`;
  }

  constructor(
    private readonly pscaleService: PlanetScaleService,
    public readonly organization: Organization,
    data: z.infer<typeof databaseSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
  }

  listBranches(): Promise<Branch[]> {
    return this.pscaleService.listBranches(this);
  }

  getBranch(name: string): Promise<Branch> {
    return this.pscaleService.getBranch(this, name);
  }

  createBranch(parent: Branch, name: string, backup?: Backup): Promise<Branch> {
    return this.pscaleService.createBranch(this, parent, name, backup);
  }

  requestDeploy(from: Branch, into: Branch): Promise<DeployRequest> {
    return this.pscaleService.requestDeploy(this, from, into);
  }
}
