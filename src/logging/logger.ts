import {
  ConsoleLogger,
  Injectable,
  LogLevel,
  LoggerService,
} from '@nestjs/common';

@Injectable()
export abstract class Logger extends ConsoleLogger implements LoggerService {
  abstract printLog(context: string, ...messages: unknown[]): void;
  abstract printError(context: string, ...messages: unknown[]): void;
  abstract printWarn(context: string, ...messages: unknown[]): void;
  abstract printDebug(context: string, ...messages: unknown[]): void;

  constructor(context: string) {
    super(context);
  }

  log(...args: unknown[]) {
    const { messages, context } = this.parseArgs(...args);
    this.printLog(context, ...messages);
  }

  error(...args: unknown[]) {
    const { messages, context } = this.parseArgs(...args);
    this.printError(context, ...messages);
  }

  warn(...args: unknown[]) {
    const { messages, context } = this.parseArgs(...args);
    this.printWarn(context, ...messages);
  }

  debug(...args: unknown[]) {
    const { messages, context } = this.parseArgs(...args);
    this.printDebug(context, ...messages);
  }

  protected parseArgs(...args: unknown[]) {
    if (args.length <= 1) {
      return { messages: args, context: this.context ?? Logger.name };
    }
    const lastElement = args[args.length - 1];
    const isContext = typeof lastElement === 'string';
    if (!isContext) {
      return { messages: args, context: this.context ?? Logger.name };
    }
    return {
      context: lastElement,
      messages: args.slice(0, args.length - 1),
    };
  }
}
