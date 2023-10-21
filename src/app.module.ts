import { Module, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { PrActionRunner } from './commands/pr_action.command';
import { GithubModule } from './github/github.module';
import { ConfigModule } from '@nestjs/config';
import { PrOpenedRunner } from './commands/pr_closed.command';
import { PrClosedRunner } from './commands/pr_opened.command';

@Module({
  imports: [ConfigModule.forRoot(), GithubModule],
  providers: [AppService, PrActionRunner, PrOpenedRunner, PrClosedRunner],
})
export class AppModule {}
