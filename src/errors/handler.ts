import { AxiosError } from 'axios';
import { ZodError } from 'zod';
import { isSymbolObject } from 'node:util/types';

export abstract class ErrorHandler {
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

  public prepare(error: Error): string | Error {
    if (error instanceof AxiosError) {
      delete error.request.socket;
      delete error.request.agent;
      delete error.request.res;
      delete (error.response as any)?.config;
      delete error.response?.request;
      this.sanitize(error);
    }
    if (error instanceof ZodError) {
      return JSON.stringify(error.format(), undefined, 2);
    }
    return error;
  }

  public handle(error: Error): void {
    const prepared = this.prepare(error);
    this.handleError(prepared);
  }

  abstract handleError(error: Error | string): void;
}
