import { z } from 'zod';
import { Server } from './server';

export const sshKeySchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  status: z.string(),
});

export class SshKey {
  public id: number;
  public name: string;
  public username: string;
  public status: string;

  constructor(
    private server: Server,
    data: z.infer<typeof sshKeySchema>,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.username = data.username;
    this.status = data.status;
  }

  private async refetch(): Promise<void> {
    const key = await this.server.getKey(this.id.toString());
    this.name = key.name;
    this.username = key.username;
    this.status = key.status;
  }

  public async waitUntilReady(): Promise<void> {
    while (this.status === 'installing') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.refetch();
    }
  }
}
