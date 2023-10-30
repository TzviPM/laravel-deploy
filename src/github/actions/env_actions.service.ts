import { Injectable } from '@nestjs/common';
import { ActionsService, InputOptions } from './actions.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvActionsService implements ActionsService {
  constructor(private readonly configService: ConfigService) {}

  constantCase(name: string): string {
    return name.toUpperCase().replace(/-/g, '_');
  }

  /**
   * Gets the value of an input. The value is also trimmed. Returns an empty string if the value is not defined.
   *
   * @param name name of the input to get, in kebab-case. The environment variable name is expected to be in SCREAMING_SNAKE_CASE.
   */
  public getInput(name: string, options?: InputOptions): string {
    const envVariableName = this.constantCase(name);
    if (options?.required) {
      return this.configService.getOrThrow<string>(envVariableName).trim();
    }
    return this.configService.getOrThrow<string>(envVariableName, '').trim();
  }

  /**
   * Gets the values of a multiline input. Each value is also trimmed. Returns an empty array if the value is not defined.
   *
   * @param name name of the input to get, in kebab-case. The environment variable name is expected to be in SCREAMING_SNAKE_CASE.
   */
  public getMultilineInput(name: string, options?: InputOptions): string[] {
    const value = this.getInput(name, options);

    return value.split('\n').map((line) => line.trim());
  }
}
