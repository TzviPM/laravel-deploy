import { TSLogger } from 'src/logging/tslog.logger';
import { ErrorHandler } from './handler';

export class LocalErrorHandler extends ErrorHandler {
  private logger = new TSLogger(LocalErrorHandler.name);

  handleError(error: Error | string): void {
    this.logger.error(error);
  }
}
