import { PlanetScaleService } from '../pscale.service';
import { z } from 'zod';
import { Organization } from './organization';
import { Branch } from './branch';
import { Backup } from './backup';
import { Observable } from 'rxjs';

export const databaseSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export class Database {
  public id: string;
  public name: string;

  public get path() {
    return `${this.organization.path}/databases/${this.id}`;
  }

  constructor(
    private readonly pscaleService: PlanetScaleService,
    public readonly organization: Organization,
    data: z.infer<typeof databaseSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
  }

  listBranches(): Observable<Branch[]> {
    return this.pscaleService.listBranches(this);
  }

  getBranch(name: string): Observable<Branch> {
    return this.pscaleService.getBranch(this, name);
  }

  createBranch(
    parent: Branch,
    name: string,
    backup?: Backup,
  ): Observable<Branch> {
    return this.pscaleService.createBranch(this, parent, name, backup);
  }
}
