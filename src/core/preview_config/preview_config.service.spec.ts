import { Test, TestingModule } from '@nestjs/testing';
import { PreviewConfigService } from './preview_config.service';

describe('PreviewConfigService', () => {
  let service: PreviewConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreviewConfigService],
    }).compile();

    service = module.get<PreviewConfigService>(PreviewConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
