import { Logger as NestLogger } from '@nestjs/common';
import { AppModule } from './app.module';
import { CommandFactory } from 'nest-commander';
import { Logger } from './logging/logger';

async function bootstrap() {
  const app = await CommandFactory.createWithoutRunning(
    AppModule,
    new NestLogger(),
  );
  const logger = app.get(Logger);
  app.useLogger(logger);
  await CommandFactory.runApplication(app);
}
bootstrap();
