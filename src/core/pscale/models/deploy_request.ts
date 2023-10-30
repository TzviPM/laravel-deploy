import { z } from 'zod';
import { Database } from './database';

export const deployRequestSchema = z.object({
  id: z.string(),
  number: z.number(),
  html_url: z.string(),
});

export class DeployRequest {
  public id: string;
  public number: number;
  public htmlUrl: string;

  public get path() {
    return `${this.database.path}/deploy-requests/${this.number}`;
  }

  constructor(
    private readonly database: Database,
    data: z.infer<typeof deployRequestSchema>,
  ) {
    this.id = data.id;
    this.number = data.number;
    this.htmlUrl = data.html_url;
  }
}
