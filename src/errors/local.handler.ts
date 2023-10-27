import { AxiosError } from 'axios';
import { ErrorHandler } from './handler';
import * as tslog from 'tslog';
import { isSymbolObject } from 'node:util/types';
import { ZodError } from 'zod';

export class LocalErrorHandler implements ErrorHandler {
  private logger = new tslog.Logger<tslog.ILogObj>({
    name: 'LocalErrorHandler',
    minLevel: 0,
  });

  private sanitize(obj: any, seen = new WeakSet()): any {
    for (const key in obj) {
      if (isSymbolObject(key)) {
        delete obj[key];
      }
      if (key.startsWith('_')) {
        delete obj[key];
        continue;
      }
      let value: any;
      try {
        value = obj[key];
      } catch {
        delete obj[key];
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => this.sanitize(item, seen));
        obj[key] = value.filter((item) => typeof item !== 'function');
        continue;
      }
      if (typeof value === 'function') {
        delete obj[key];
        continue;
      }
      if (
        ['string', 'number', 'boolean'].includes(typeof value) ||
        value == null
      ) {
        continue;
      }
      if (seen.has(value)) {
        continue;
      } else {
        seen.add(value);
        this.sanitize(value, seen);
      }
    }
  }

  handle(error: Error): void {
    if (error instanceof AxiosError) {
      delete error.request.socket;
      delete error.request.agent;
      delete error.request.res;
      delete error.response.config;
      delete error.response.request;
      this.sanitize(error);
    }
    if (error instanceof ZodError) {
      this.logger.error(error.format());
      return;
    }
    this.logger.error(error);
  }
}
