import { INTERNAL_SIGNATURE_HEADER } from '@/constants';
import { Context, Next } from 'hono';
import { HMACHandler } from './HMACHandler';

class MiddlewareHandlers {
  public static hmacValidation() {
    return async (c: Context<{ Bindings: Env }>, next: Next): Promise<void> => {
      const signature: string | undefined = c.req.header(INTERNAL_SIGNATURE_HEADER);
      if (signature) {
        await HMACHandler.validateInternalRequest(c, next);
      } else {
        await next();
      }
    };
  }
}

export { MiddlewareHandlers };
