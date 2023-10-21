import { Test, TestingModule } from '@nestjs/testing';
import { ForgeService } from './forge.service';

describe('ForgeService', () => {
  let service: ForgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ForgeService],
    }).compile();

    service = module.get<ForgeService>(ForgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
