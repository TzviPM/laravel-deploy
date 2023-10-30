import { Injectable } from '@nestjs/common';
import { Message } from './messages';

@Injectable()
export abstract class CommentsService {
  abstract postComment(message: Message): void;
}
