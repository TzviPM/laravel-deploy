import { GithubLogger } from 'src/logging/github.logger';
import { ErrorHandler } from './handler';
import * as core from '@actions/core';

export class GithubErrorHandler extends ErrorHandler {
  private logger = new GithubLogger(GithubErrorHandler.name);

  handleError(error: string | Error): void {
    this.logger.error(error);
    core.setFailed(error);
  }
}
