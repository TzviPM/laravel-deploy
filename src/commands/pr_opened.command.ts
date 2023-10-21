import { Logger } from '@nestjs/common';
import { CommandRunner, Command } from 'nest-commander';
import { DeploymentService } from 'src/core/deployment/deployment.service';
import { ContextService } from 'src/github/context/context.service';

@Command({
  name: 'opened',
  description: 'Run PR opened action',
})
export class PrOpenedRunner extends CommandRunner {
  private readonly logger = new Logger(PrOpenedRunner.name);

  constructor(private readonly deploymentService: DeploymentService) {
    super();
  }

  async run() {
    this.logger.log('PR opened');
    await this.deploymentService.createPreview();
  }
}
