import { PlanetScaleService } from '../pscale.service';
import { z } from 'zod';
import { Branch } from './branch';

export const credentialsSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().optional().nullable(),
  plain_text: z.string().optional().nullable(),
});

export class Credentials {
  public id: string;
  public name: string;
  public username: string;
  public password: string;

  public get path() {
    return `${this.branch.path}/passwords/${this.id}`;
  }

  constructor(
    private readonly pscaleService: PlanetScaleService,
    private readonly branch: Branch,
    data: z.infer<typeof credentialsSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.username = data.username;
    this.password = data.plain_text;
  }
}
