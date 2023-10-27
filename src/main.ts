import { Logger as NestLogger } from '@nestjs/common';
import { AppModule } from './app.module';
import { CommandFactory } from 'nest-commander';
import { Logger } from './logging/logger';
import { ErrorHandler } from './errors/handler';

async function bootstrap() {
  const errorHandler = ErrorHandler.forEnv();

  const app = await CommandFactory.createWithoutRunning(AppModule, {
    logger: new NestLogger(),
    errorHandler: (error: Error) => errorHandler.handle(error),
    serviceErrorHandler: (error: Error) => errorHandler.handle(error),
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  try {
    await CommandFactory.runApplication(app);
    await app.close();
  } catch (e) {
    await errorHandler.handle(e);
  }
}
bootstrap();
