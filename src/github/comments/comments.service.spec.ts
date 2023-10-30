import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { LoggerCommentsService } from './logger_comments.service';

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CommentsService,
          useClass: LoggerCommentsService,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
