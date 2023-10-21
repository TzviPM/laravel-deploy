import { z } from 'zod';
import { Server } from './server';

export const siteSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string().nullable(),
  username: z.string(),
  directory: z.string(),
});

export class Site {
  public id: number;
  public name: string;
  public status: string | null;
  public username: string;
  public directory: string;

  constructor(
    public readonly server: Server,
    data: z.infer<typeof siteSchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.status = data.status;
    this.username = data.username;
    this.directory = data.directory;
  }
}
