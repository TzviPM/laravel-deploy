import { Logger } from '@nestjs/common';
import { CommandRunner, Command } from 'nest-commander';
import { DeploymentService } from 'src/core/deployment/deployment.service';
import { ContextService } from 'src/github/context/context.service';

@Command({
  name: 'merged',
  description: 'Run PR merged action',
})
export class PrMergedRunner extends CommandRunner {
  private readonly logger = new Logger(PrMergedRunner.name);

  constructor(private readonly deploymentService: DeploymentService) {
    super();
  }

  async run() {
    this.logger.log('PR merged');
    await this.deploymentService.destroyPreview(true);
  }
}
