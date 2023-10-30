import { CommentsService } from './comments.service';
import { Injectable, Logger } from '@nestjs/common';
import { Message } from './messages';

@Injectable()
export class LoggerCommentsService implements CommentsService {
  private logger = new Logger(LoggerCommentsService.name);

  postComment(message: Message): void {
    this.logger.log(message.toPlainText());
  }
}
