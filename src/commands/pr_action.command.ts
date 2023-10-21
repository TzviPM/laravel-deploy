import { Logger } from '@nestjs/common';
import { CommandRunner, Command } from 'nest-commander';
import { ActionType, ContextService } from 'src/github/context/context.service';
import { PrOpenedRunner } from './pr_closed.command';
import { PrClosedRunner } from './pr_opened.command';

@Command({
  name: 'pr',
  description: 'Run PR action',
  options: {
    isDefault: true,
    hidden: true,
  },
})
export class PrActionRunner extends CommandRunner {
  private readonly logger = new Logger(PrActionRunner.name);

  constructor(
    private readonly contextService: ContextService,
    private readonly openedCommand: PrOpenedRunner,
    private readonly closedCommand: PrClosedRunner,
  ) {
    super();
  }

  async run() {
    switch (this.contextService.getActionType()) {
      case ActionType.Opened:
        return this.openedCommand.run();
      case ActionType.Closed:
        return this.closedCommand.run();
      default:
        this.logger.log('Unknown PR action');
        break;
    }
  }
}
