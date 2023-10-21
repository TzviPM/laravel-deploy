import { Injectable } from '@nestjs/common';
import { Logger } from './logger';
import * as winston from 'winston';

@Injectable()
export class WinstonLogger extends Logger {
  private readonly logger = winston.createLogger({
    level: 'debug',
    transports: [new winston.transports.Console()],
  });

  log(message: any, ...optionalParams: any[]) {
    this.logger.info(message, ...optionalParams);
  }
  error(message: any, ...optionalParams: any[]) {
    this.logger.error(message, ...optionalParams);
  }
  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(message, ...optionalParams);
  }
  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(message, ...optionalParams);
  }
}
