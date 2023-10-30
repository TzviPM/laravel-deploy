import { Injectable } from '@nestjs/common';
import * as ciInfo from 'ci-info';

@Injectable()
export abstract class ContextService {
  public static isRunningOnGithub(): boolean {
    return ciInfo.GITHUB_ACTIONS;
  }

  abstract getPullRequest(): PullRequest;

  abstract getActionType(): ActionType;
}

export interface PullRequest {
  branchName: string;
  baseBranchName: string;
  repo: {
    name: string;
    owner: string;
    fullName: string;
  };
  number: number;
}

export enum ActionType {
  Opened,
  Closed,
  Merged,
  Unknown,
}
