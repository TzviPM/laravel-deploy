import { ContextService } from 'src/github/context/context.service';
import { GithubErrorHandler } from './github.handler';
import { LocalErrorHandler } from './local.handler';

export abstract class ErrorHandler {
  static forEnv(): ErrorHandler {
    return ContextService.isRunningOnGithub()
      ? new GithubErrorHandler()
      : new LocalErrorHandler();
  }

  abstract handle(error: Error): void;
}
