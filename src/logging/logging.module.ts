import { Module } from '@nestjs/common';
import { Logger } from './logger';
import { ContextService } from 'src/github/context/context.service';
import { GithubLogger } from './github.logger';
import { WinstonLogger } from './winston.logger';

@Module({
  providers: [
    {
      provide: Logger,
      useClass: ContextService.isRunningOnGithub()
        ? GithubLogger
        : WinstonLogger,
    },
  ],
})
export class LoggingModule {}
