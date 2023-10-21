import { ActionType, ContextService, PullRequest } from './context.service';
import * as github from '@actions/github';
import { Injectable } from '@nestjs/common';
import { PullRequestEvent } from '@octokit/webhooks-definitions/schema';

@Injectable()
export class GithubContextService implements ContextService {
  private readonly pr = github.context.payload as PullRequestEvent;

  getPullRequest(): PullRequest {
    return {
      number: this.pr.number,
      branchName: this.pr.pull_request.head.ref,
      repo: {
        name: this.pr.repository.name,
        owner: this.pr.repository.owner.login,
        fullName: this.pr.repository.full_name,
      },
    };
  }

  getActionType(): ActionType {
    switch (this.pr.action) {
      case 'opened':
        return ActionType.Opened;
      case 'closed':
        return ActionType.Closed;
      default:
        return ActionType.Unknown;
    }
  }
}
