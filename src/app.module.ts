import { Module, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { PrActionRunner } from './commands/pr_action.command';

@Module({
  imports: [],
  providers: [AppService, PrActionRunner],
})
export class AppModule {}
