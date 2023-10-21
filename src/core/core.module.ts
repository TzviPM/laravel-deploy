import { Module } from '@nestjs/common';
import { PreviewConfigService } from './preview_config/preview_config.service';
import { GithubModule } from 'src/github/github.module';
import { DeploymentService } from './deployment/deployment.service';
import { ForgeService } from './forge/forge.service';
import { HttpModule } from '@nestjs/axios';
import { EnvoyerService } from './envoyer/envoyer.service';
import { PlanetScaleService } from './pscale/pscale.service';

@Module({
  imports: [GithubModule, HttpModule],
  providers: [
    PreviewConfigService,
    DeploymentService,
    ForgeService,
    GithubModule,
    EnvoyerService,
    PlanetScaleService,
  ],
  exports: [DeploymentService],
})
export class CoreModule {}
