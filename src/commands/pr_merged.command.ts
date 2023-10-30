import { Logger } from '@nestjs/common';
import { CommandRunner, Command } from 'nest-commander';
import { DeploymentService } from 'src/core/deployment/deployment.service';
import { CommentsService } from 'src/github/comments/comments.service';
import { Message } from 'src/github/comments/messages';

@Command({
  name: 'merged',
  description: 'Run PR merged action',
})
export class PrMergedRunner extends CommandRunner {
  private readonly logger = new Logger(PrMergedRunner.name);

  constructor(
    private readonly deploymentService: DeploymentService,
    private readonly commentsService: CommentsService,
  ) {
    super();
  }

  async run() {
    this.logger.log('PR merged');
    const result = await this.deploymentService.destroyPreview(true);

    const message = Message.Seq(
      Message.Text('A PlanetScale deploy request has been created at'),
      Message.Link(result.planetScaleRequestUrl),
    );

    await this.commentsService.postComment(message);
  }
}
