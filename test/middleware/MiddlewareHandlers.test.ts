import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

const { auditLogCreateSpy, auditLogConstructorSpy, waitUntilSpy } = vi.hoisted(() => {
  return {
    auditLogCreateSpy: vi.fn(),
    auditLogConstructorSpy: vi.fn(),
    waitUntilSpy: vi.fn(),
  };
});

vi.mock('@/dao/AuditLogDAO', () => {
  class MockAuditLogDAO {
    constructor(database: unknown) {
      auditLogConstructorSpy(database);
    }

    create = auditLogCreateSpy;
  }

  return {
    AuditLogDAO: MockAuditLogDAO,
  };
});

import { MiddlewareHandlers } from '@/middleware';

describe('MiddlewareHandlers', () => {
  beforeEach(() => {
    auditLogCreateSpy.mockReset();
    auditLogCreateSpy.mockResolvedValue(undefined);
    auditLogConstructorSpy.mockReset();
    waitUntilSpy.mockReset();
  });

  describe('activityAudit', () => {
    it('writes an audit log entry with the authenticated user and response status', async () => {
      const app = new Hono<{ Bindings: Env; Variables: { AuthenticatedUserEmailAddress: string } }>();
      app.use('*', MiddlewareHandlers.activityAudit());
      app.get('/api/test', async (c) => {
        c.set('AuthenticatedUserEmailAddress', 'user@example.com');
        return c.json({ ok: true }, 201);
      });

      const response: Response = await app.fetch(
        new Request('https://worker.example.com/api/test', {
          headers: {
            'CF-Connecting-IP': '203.0.113.10',
            'User-Agent': 'Vitest',
          },
        }),
        { AccessBridgeDB: { mock: true } as D1DatabaseSession } as Env,
        {
          waitUntil: waitUntilSpy,
          passThroughOnException: vi.fn(),
        } as unknown as ExecutionContext,
      );

      expect(response.status).toBe(201);
      expect(auditLogConstructorSpy).toHaveBeenCalledWith({ mock: true });
      expect(auditLogCreateSpy).toHaveBeenCalledWith(
        'user@example.com',
        'GET:/api/test',
        'GET',
        '/api/test',
        201,
        undefined,
        undefined,
        '203.0.113.10',
        'Vitest',
      );
      expect(waitUntilSpy).toHaveBeenCalledTimes(1);
    });

    it('writes an audit log entry with unknown user when authentication has not populated the context', async () => {
      const app = new Hono<{ Bindings: Env; Variables: { AuthenticatedUserEmailAddress: string } }>();
      app.use('*', MiddlewareHandlers.activityAudit());
      app.get('/api/test', async (c) => {
        return c.json(
          {
            Exception: {
              Type: 'Unauthorized',
              Message: 'Missing auth',
            },
          },
          401,
        );
      });

      const response: Response = await app.fetch(
        new Request('https://worker.example.com/api/test'),
        { AccessBridgeDB: { mock: true } as D1DatabaseSession } as Env,
        {
          waitUntil: waitUntilSpy,
          passThroughOnException: vi.fn(),
        } as unknown as ExecutionContext,
      );

      expect(response.status).toBe(401);
      expect(auditLogCreateSpy).toHaveBeenCalledWith(
        'unknown',
        'GET:/api/test',
        'GET',
        '/api/test',
        401,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(waitUntilSpy).toHaveBeenCalledTimes(1);
    });
  });
});
