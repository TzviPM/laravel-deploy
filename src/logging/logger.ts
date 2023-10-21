import { Injectable, LogLevel, LoggerService } from '@nestjs/common';

@Injectable()
export abstract class Logger implements LoggerService {
  abstract log(message: any, ...optionalParams: any[]);

  abstract error(message: any, ...optionalParams: any[]);

  abstract warn(message: any, ...optionalParams: any[]);

  abstract debug(message: any, ...optionalParams: any[]);

  verbose(message: any, ...optionalParams: any[]) {
    throw new Error('Method not implemented: verbose.');
  }
  fatal(message: any, ...optionalParams: any[]) {
    throw new Error('Method not implemented: fatal.');
  }
  setLogLevels?(levels: LogLevel[]) {
    throw new Error('Method not implemented: setLogLevels.');
  }
}
