import { Test, TestingModule } from '@nestjs/testing';
import { EnvActionsService } from '../actions/env_actions.service';

describe('EnvActionsService', () => {
  let service: EnvActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvActionsService],
    }).compile();

    service = module.get<EnvActionsService>(EnvActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
