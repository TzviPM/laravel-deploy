import { Logger } from '@nestjs/common';
import { CommandRunner, Command } from 'nest-commander';
import { DeploymentService } from 'src/core/deployment/deployment.service';
import { CommentsService } from 'src/github/comments/comments.service';
import { Message } from 'src/github/comments/messages';
import { ContextService } from 'src/github/context/context.service';

@Command({
  name: 'closed',
  description: 'Run PR closed action',
})
export class PrClosedRunner extends CommandRunner {
  private readonly logger = new Logger(PrClosedRunner.name);

  constructor(
    private readonly deploymentService: DeploymentService,
    private readonly commentsService: CommentsService,
  ) {
    super();
  }

  async run() {
    this.logger.log('PR closed');
    await this.deploymentService.destroyPreview(false);

    const message = Message.Text(
      'Deployment preview and associated resources have been teared down.',
    );

    await this.commentsService.postComment(message);
  }
}
