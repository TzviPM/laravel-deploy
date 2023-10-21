import { Logger } from '@nestjs/common';
import { CommandRunner, Command } from 'nest-commander';
import { AppService } from 'src/app.service';
import { ActionType, ContextService } from 'src/github/context/context.service';

@Command({
  name: 'closed',
  description: 'Run PR closed action',
})
export class PrClosedRunner extends CommandRunner {
  private readonly logger = new Logger(PrClosedRunner.name);

  constructor(
    private readonly appService: AppService,
    private readonly contextService: ContextService,
  ) {
    super();
  }

  async run() {
    this.logger.log('PR closed');
  }
}
