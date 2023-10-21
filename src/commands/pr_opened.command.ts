import { Logger } from '@nestjs/common';
import { CommandRunner, Command } from 'nest-commander';
import { ContextService } from 'src/github/context/context.service';

@Command({
  name: 'closed',
  description: 'Run PR closed action',
})
export class PrClosedRunner extends CommandRunner {
  private readonly logger = new Logger(PrClosedRunner.name);

  constructor(private readonly contextService: ContextService) {
    super();
  }

  async run() {
    this.logger.log('PR closed');
  }
}
