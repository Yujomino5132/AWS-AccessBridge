import { INTERNAL_HEADER_PREFIX, SELF_WORKER_BASE_HOSTNAME } from '@/constants';
import { Context, Next } from 'hono';
import { HMACHandler } from './HMACHandler';
import { IServiceError } from '@/error';
import { ErrorTranslationUtil } from '@/utils';

class MiddlewareHandlers {
  public static hmacValidation() {
    return async (c: Context<{ Bindings: Env }>, next: Next): Promise<void> => {
      const url: URL = new URL(c.req.url);
      const hasInternalHeaders: boolean = Array.from(c.req.raw.headers.keys()).some((key) => key.startsWith(INTERNAL_HEADER_PREFIX));
      if (url.hostname === SELF_WORKER_BASE_HOSTNAME || hasInternalHeaders) {
        await this.withErrorTranslation(HMACHandler.validateInternalRequest)(c, next);
      } else {
        await next();
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static withErrorTranslation<T extends any[], R>(fn: (...args: T) => Promise<R>): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error: unknown) {
        if (error instanceof IServiceError) {
          throw ErrorTranslationUtil.toHTTPException(error);
        }
        throw error;
      }
    };
  }
}

export { MiddlewareHandlers };
