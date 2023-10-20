import { Logger } from '@nestjs/common';
import { CommandRunner, RootCommand } from 'nest-commander';
import { AppService } from 'src/app.service';

@RootCommand({})
export class PrActionRunner extends CommandRunner {
  private readonly logger = new Logger(PrActionRunner.name);

  constructor(private readonly appService: AppService) {
    super();
  }

  async run() {
    const message = this.appService.getHello();
    this.logger.log(message);
  }
}
