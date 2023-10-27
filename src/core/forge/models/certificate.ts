import { z } from 'zod';
import { Site } from './site';

export const certificateSchema = z.object({
  domain: z.string(),
  request_status: z.string(),
  status: z.string().optional().nullable(),
  id: z.number(),
});

export class Certificate {
  public domain: string;
  public status: string;
  public id: number;

  constructor(
    private site: Site,
    data: z.infer<typeof certificateSchema>,
  ) {
    this.id = data.id;
    this.status = data.status ?? data.request_status;
    this.domain = data.domain;
  }

  private async refetch(): Promise<void> {
    const key = await this.site.getCert(this.id.toString());
    this.status = key.status;
  }

  public async waitUntilReady(): Promise<void> {
    while (['installing', 'creating'].includes(this.status)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.refetch();
    }
  }
}
