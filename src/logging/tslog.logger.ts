import { Injectable } from '@nestjs/common';
import { Logger } from './logger';
import * as tslog from 'tslog';

@Injectable()
export class TSLogger extends Logger {
  private readonly logger: tslog.Logger<tslog.ILogObj>;

  constructor(context: string) {
    super(context);
    this.logger = new tslog.Logger<tslog.ILogObj>({
      name: context,
      minLevel: 0,
    });
  }

  setContext(context: string): void {
    this.logger.settings.name = context;
  }

  private withName(name: string, fn: () => void) {
    const oldName = this.logger.settings.name;
    this.setContext(name);
    fn();
    if (oldName) {
      this.setContext(oldName);
    }
  }

  printLog(context: string, ...messages: unknown[]): void {
    this.withName(context, () => this.logger.info(...messages));
  }

  printError(context: string, ...messages: unknown[]): void {
    if (messages[0] instanceof Error) {
      throw messages[0];
    }
    this.withName(context, () => this.logger.error(...messages));
  }

  printWarn(context: string, ...messages: unknown[]): void {
    this.withName(context, () => this.logger.warn(...messages));
  }

  printDebug(context: string, ...messages: unknown[]): void {
    this.withName(context, () => this.logger.debug(...messages));
  }
}
