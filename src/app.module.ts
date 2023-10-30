import { Module } from '@nestjs/common';
import { PrActionRunner } from './commands/pr_action.command';
import { GithubModule } from './github/github.module';
import { ConfigModule } from '@nestjs/config';
import { PrOpenedRunner } from './commands/pr_opened.command';
import { PrClosedRunner } from './commands/pr_closed.command';
import { CoreModule } from './core/core.module';
import { LoggingModule } from './logging/logging.module';
import { PrMergedRunner } from './commands/pr_merged.command';

@Module({
  imports: [ConfigModule.forRoot(), GithubModule, CoreModule, LoggingModule],
  providers: [PrActionRunner, PrOpenedRunner, PrClosedRunner, PrMergedRunner],
})
export class AppModule {}
