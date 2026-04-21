import { AUDIT_ACTIONS } from '@/constants/AuditActions';
import { INTERNAL_HEADER_PREFIX, SELF_WORKER_BASE_HOSTNAME } from '@/constants';
import { AuditLogDAO } from '@/dao/AuditLogDAO';
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

  public static activityAudit() {
    return async (
      c: Context<{ Bindings: Env; Variables: { AuthenticatedUserEmailAddress: string } }>,
      next: Next,
    ): Promise<void> => {
      let statusCode: number = 200;

      try {
        await next();
        statusCode = c.res.status;
      } catch (error: unknown) {
        if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
          statusCode = error.status;
        } else {
          statusCode = 500;
        }
        throw error;
      } finally {
        try {
          const method: string = c.req.method;
          const url: URL = new URL(c.req.url);
          const path: string = url.pathname;
          const action: string = AUDIT_ACTIONS[`${method}:${path}`] || `${method}:${path}`;
          const userEmail: string = c.get('AuthenticatedUserEmailAddress') || 'unknown';
          const ipAddress: string | undefined = c.req.header('CF-Connecting-IP');
          const userAgentHeader: string | undefined = c.req.header('User-Agent');

          const auditLogDAO: AuditLogDAO = new AuditLogDAO(c.env.AccessBridgeDB);
          c.executionCtx.waitUntil(
            auditLogDAO.create(userEmail, action, method, path, statusCode, undefined, undefined, ipAddress, userAgentHeader),
          );
        } catch {
          console.warn('Failed to write audit log');
        }
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
