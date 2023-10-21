import { Observable } from 'rxjs';
import { PlanetScaleService } from '../pscale.service';
import { z } from 'zod';
import { Database } from './database';

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export class Organization {
  public id: string;
  public name: string;

  public get path() {
    return `organizations/${this.id}`;
  }

  constructor(
    private readonly pscaleService: PlanetScaleService,
    data: z.infer<typeof organizationSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
  }

  listDatabases(): Observable<Database[]> {
    return this.pscaleService.listDatabases(this);
  }

  getDatabase(id: string): Observable<Database> {
    return this.pscaleService.getDatabase(this, id);
  }
}
