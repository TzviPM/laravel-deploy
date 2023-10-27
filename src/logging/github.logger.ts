import { Injectable, LogLevel, LoggerService } from '@nestjs/common';
import { Logger } from './logger';
import * as core from '@actions/core';
import * as tslog from 'tslog';
import { formatWithOptions } from 'node:util';

@Injectable()
export class GithubLogger extends Logger {
  private getLogger(name: string, log: (message: string) => void) {
    return new tslog.Logger({
      type: 'pretty',
      minLevel: 0,
      name,
      overwrite: {
        transportFormatted(logMetaMarkup, logArgs, logErrors, settings) {
          const logErrorsStr =
            (logErrors.length > 0 && logArgs.length > 0 ? '\n' : '') +
            logErrors.join('\n');
          settings.prettyInspectOptions.colors = settings.stylePrettyLogs;
          log(
            logMetaMarkup +
              formatWithOptions(settings.prettyInspectOptions, ...logArgs) +
              logErrorsStr,
          );
        },
      },
    });
  }

  printLog(context: string, ...messages: unknown[]): void {
    this.getLogger(context, core.info).info(...messages);
  }

  printError(context: string, ...messages: unknown[]): void {
    this.getLogger(context, core.error).error(...messages);
  }

  printWarn(context: string, ...messages: unknown[]): void {
    this.getLogger(context, core.warning).warn(...messages);
  }

  printDebug(context: string, ...messages: unknown[]): void {
    this.getLogger(context, core.debug).debug(...messages);
  }
}
