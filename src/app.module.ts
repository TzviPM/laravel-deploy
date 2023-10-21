import { Module } from '@nestjs/common';
import { PrActionRunner } from './commands/pr_action.command';
import { GithubModule } from './github/github.module';
import { ConfigModule } from '@nestjs/config';
import { PrOpenedRunner } from './commands/pr_closed.command';
import { PrClosedRunner } from './commands/pr_opened.command';

@Module({
  imports: [ConfigModule.forRoot(), GithubModule],
  providers: [PrActionRunner, PrOpenedRunner, PrClosedRunner],
})
export class AppModule {}
