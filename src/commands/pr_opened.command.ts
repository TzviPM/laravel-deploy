import { Logger } from '@nestjs/common';
import { CommandRunner, Command } from 'nest-commander';
import { DeploymentService } from 'src/core/deployment/deployment.service';
import { CommentsService } from 'src/github/comments/comments.service';
import { Message } from 'src/github/comments/messages';

@Command({
  name: 'opened',
  description: 'Run PR opened action',
})
export class PrOpenedRunner extends CommandRunner {
  private readonly logger = new Logger(PrOpenedRunner.name);

  constructor(
    private readonly deploymentService: DeploymentService,
    private readonly commentsService: CommentsService,
  ) {
    super();
  }

  async run() {
    this.logger.log('PR opened');
    const preview = await this.deploymentService.createPreview();

    const message = Message.Seq(
      Message.Text('Deployment preview created at'),
      Message.Link(preview.url),
    );

    await this.commentsService.postComment(message);
  }
}
