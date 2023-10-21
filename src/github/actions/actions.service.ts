import { Injectable } from '@nestjs/common';
import * as core from '@actions/core';

export interface InputOptions {
  /**
   * Optional. Whether the input is required. If required and not present, will throw.
   * Default false
   */
  required?: boolean;
}

@Injectable()
export class ActionsService {
  /**
   * Gets the value of an input. The value is also trimmed. Returns an empty string if the value is not defined.
   *
   * @param name name of the input to get, in kebab-case.
   */
  public getInput(name: string, options?: InputOptions): string {
    return core.getInput(name, options);
  }

  /**
   * Gets the values of a multiline input. Each value is also trimmed. Returns an empty array if the value is not defined.
   *
   * @param name name of the input to get, in kebab-case.
   */
  public getMultilineInput(name: string, options?: InputOptions): string[] {
    return core.getMultilineInput(name, options);
  }
}
