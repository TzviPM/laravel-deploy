import { Test, TestingModule } from '@nestjs/testing';
import { EnvoyerService } from './envoyer.service';

describe('EnvoyerService', () => {
  let service: EnvoyerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvoyerService],
    }).compile();

    service = module.get<EnvoyerService>(EnvoyerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
