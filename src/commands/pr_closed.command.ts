import { Logger } from '@nestjs/common';
import { CommandRunner, Command } from 'nest-commander';
import { AppService } from 'src/app.service';
import { ActionType, ContextService } from 'src/github/context/context.service';

@Command({
  name: 'opened',
  description: 'Run PR opened action',
})
export class PrOpenedRunner extends CommandRunner {
  private readonly logger = new Logger(PrOpenedRunner.name);

  constructor(
    private readonly appService: AppService,
    private readonly contextService: ContextService,
  ) {
    super();
  }

  async run() {
    this.logger.log('PR opened');
  }
}
