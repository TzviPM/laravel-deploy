import { Module, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Module({
  imports: [],
  providers: [AppService],
})
export class AppModule {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly appService: AppService) {}

  public run() {
    const message = this.appService.getHello();
    this.logger.log(message);
  }
}
