import { Injectable, Logger } from '@nestjs/common';
import { ActionsService } from 'src/github/actions/actions.service';

@Injectable()
export class PreviewConfigService {
  private readonly logger = new Logger(PreviewConfigService.name);

  constructor(private readonly actionService: ActionsService) {}

  getServers() {
    return this.actionService
      .getMultilineInput('servers', { required: true })
      .map((line) => {
        this.logger.debug(`Parsing server input line: ${line}`);
        try {
          const [domain, id] = line.split(' ');
          if (!domain || !id) {
            throw new Error(
              `Each line must contain a domain name and a Forge server ID separated by one space. Found '${line}'.`,
            );
          }
          if (/\D/.test(id)) {
            throw new Error(
              `Each server ID must be an integer. Found '${line}'.`,
            );
          }
          return { domain, id: parseInt(id) };
        } catch (e: unknown) {
          const error = e as Error;
          this.logger.error(`Invalid \`servers\` input. ${error.message}`);
        }
      });
  }

  getForgeToken() {
    return this.actionService.getInput('forge-token', { required: true });
  }

  getEnvoyerToken() {
    return this.actionService.getInput('envoyer-token', { required: true });
  }

  getPScaleToken() {
    const id = this.actionService.getInput('pscale-token-id', {
      required: true,
    });
    const token = this.actionService.getInput('pscale-token', {
      required: true,
    });

    return { id, token };
  }

  getPScaleOrganization() {
    return this.actionService.getInput('pscale-organization', {
      required: true,
    });
  }

  getPScaleDatabase() {
    return this.actionService.getInput('pscale-database', {
      required: true,
    });
  }

  getProjectName() {
    return this.actionService.getInput('project');
  }

  getEnvironment() {
    return this.actionService.getInput('environment');
  }
}
