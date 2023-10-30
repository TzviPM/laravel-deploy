import { Logger } from '@nestjs/common';
import { CommandRunner, Command } from 'nest-commander';
import { ActionType, ContextService } from 'src/github/context/context.service';
import { PrOpenedRunner } from './pr_opened.command';
import { PrClosedRunner } from './pr_closed.command';
import { PrMergedRunner } from './pr_merged.command';

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
    private readonly mergedCommand: PrMergedRunner,
  ) {
    super();
  }

  async run() {
    switch (this.contextService.getActionType()) {
      case ActionType.Opened:
        return await this.openedCommand.run();
      case ActionType.Closed:
        return this.closedCommand.run();
      case ActionType.Merged:
        return this.mergedCommand.run();
      default:
        this.logger.log('Unknown PR action');
        break;
    }
  }
}
