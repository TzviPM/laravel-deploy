import { Module } from '@nestjs/common';
import { Logger } from './logger';
import { ContextService } from 'src/github/context/context.service';
import { GithubLogger } from './github.logger';
import { TSLogger } from './tslog.logger';

@Module({
  providers: [
    {
      provide: Logger,
      useClass: ContextService.isRunningOnGithub() ? GithubLogger : TSLogger,
    },
  ],
})
export class LoggingModule {}
