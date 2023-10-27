import { ContextService } from 'src/github/context/context.service';
import { ErrorHandler } from './handler';
import { GithubErrorHandler } from './github.handler';
import { LocalErrorHandler } from './local.handler';

export function errorHandlerForEnv(): ErrorHandler {
  return ContextService.isRunningOnGithub()
    ? new GithubErrorHandler()
    : new LocalErrorHandler();
}
