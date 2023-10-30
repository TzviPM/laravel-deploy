import { CommentsService } from './comments.service';
import * as github from '@actions/github';
import { Injectable } from '@nestjs/common';
import { Message } from './messages';
import { ActionsService } from '../actions/actions.service';
import { ContextService } from '../context/context.service';

type OctoKit = ReturnType<typeof github.getOctokit>;

@Injectable()
export class GithubCommentsService implements CommentsService {
  private token: string;
  private client: OctoKit;

  constructor(
    private actionsService: ActionsService,
    private contextService: ContextService,
  ) {
    this.token = this.actionsService.getInput('github-token');
    this.client = github.getOctokit(this.token);
  }

  postComment(message: Message): void {
    const pr = this.contextService.getPullRequest();

    this.client.rest.issues.createComment({
      owner: pr.repo.owner,
      repo: pr.repo.name,
      issue_number: pr.number,
      body: message.toGFM(),
    });
  }
}
