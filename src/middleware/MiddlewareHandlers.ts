import { INTERNAL_HEADER_PREFIX, SELF_WORKER_BASE_HOSTNAME } from '@/constants';
import { Context, Next } from 'hono';
import { HMACHandler } from './HMACHandler';

class MiddlewareHandlers {
  public static hmacValidation() {
    return async (c: Context<{ Bindings: Env }>, next: Next): Promise<void> => {
      const url: URL = new URL(c.req.url);
      const hasInternalHeaders: boolean = Array.from(c.req.raw.headers.keys()).some((key) => key.startsWith(INTERNAL_HEADER_PREFIX));
      if (url.hostname === SELF_WORKER_BASE_HOSTNAME || hasInternalHeaders) {
        await HMACHandler.validateInternalRequest(c, next);
      } else {
        await next();
      }
    };
  }
}

export { MiddlewareHandlers };
