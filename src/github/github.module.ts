import { Module } from '@nestjs/common';
import { ActionsService } from './actions/actions.service';
import { EnvActionsService } from './actions/env_actions.service';
import { ConfigModule } from '@nestjs/config';
import { ContextService } from './context/context.service';
import { GithubContextService } from './context/github_context.service';
import { EnvContextService } from './context/env_context_service';
import { CommentsService } from './comments/comments.service';
import { GithubCommentsService } from './comments/github_comments.service';
import { LoggerCommentsService } from './comments/logger_comments.service';

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
    {
      provide: CommentsService,
      useClass: ContextService.isRunningOnGithub()
        ? GithubCommentsService
        : LoggerCommentsService,
    },
  ],
  exports: [ActionsService, ContextService, CommentsService],
})
export class GithubModule {}
