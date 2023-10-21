import { Module } from '@nestjs/common';
import { ActionsService } from './actions/actions.service';
import { EnvActionsService } from './actions/env_actions.service';
import { ConfigModule } from '@nestjs/config';
import { ContextService } from './context/context.service';
import { GithubContextService } from './context/github_context.service';
import { EnvContextService } from './context/env_context_service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: ActionsService,
      useClass: ContextService.isRunningOnGithub()
        ? ActionsService
        : EnvActionsService,
    },
    {
      provide: ContextService,
      useClass: ContextService.isRunningOnGithub()
        ? GithubContextService
        : EnvContextService,
    },
  ],
  exports: [ActionsService, ContextService],
})
export class GithubModule {}
