import { Injectable, LogLevel, LoggerService } from '@nestjs/common';
import { Logger } from './logger';
import * as core from '@actions/core';

@Injectable()
export class GithubLogger extends Logger {
  log(message: any, ...optionalParams: any[]) {
    core.info(message);
  }
  error(message: any, ...optionalParams: any[]) {
    core.error(message, ...optionalParams);
  }
  warn(message: any, ...optionalParams: any[]) {
    core.warning(message, ...optionalParams);
  }
  debug(message: any, ...optionalParams: any[]) {
    core.debug(message);
  }
}
