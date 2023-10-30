import { Injectable } from '@nestjs/common';
import { ActionType, ContextService, PullRequest } from './context.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvContextService implements ContextService {
  constructor(private readonly configService: ConfigService) {}

  getPullRequest(): PullRequest {
    const number = this.configService.getOrThrow('GITHUB_PR_NUMBER');
    const branchName = this.configService.getOrThrow('GITHUB_PR_BRANCH_NAME');
    const baseBranchName = this.configService.getOrThrow(
      'GITHUB_PR_BASE_BRANCH_NAME',
    );
    const repoName = this.configService.getOrThrow('GITHUB_REPO_NAME');
    const repoOwner = this.configService.getOrThrow('GITHUB_REPO_OWNER');
    const repoFullName = this.configService.getOrThrow(
      'GITHUB_REPO_FULL_NAME',
      [repoOwner, repoName].join('/'),
    );

    return {
      number,
      branchName,
      baseBranchName,
      repo: {
        name: repoName,
        owner: repoOwner,
        fullName: repoFullName,
      },
    };
  }

  getActionType(): ActionType {
    const actionType = this.configService.get<string>(
      'GITHUB_ACTION_TYPE',
      'unknown',
    );

    switch (actionType) {
      case 'opened':
        return ActionType.Opened;
      case 'closed':
        return ActionType.Closed;
      case 'merged':
        return ActionType.Merged;
      default:
        return ActionType.Unknown;
    }
  }
}
