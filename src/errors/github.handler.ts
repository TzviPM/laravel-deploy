import { ErrorHandler } from './handler';
import * as core from '@actions/core';

export class GithubErrorHandler implements ErrorHandler {
  handle(error: Error): void {
    core.setFailed(error);
  }
}
