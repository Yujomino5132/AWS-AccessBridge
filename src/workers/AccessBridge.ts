import { AbstractWorker } from '@/base';
import { fromHono, HonoOpenAPIRouterType } from 'chanfana';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GenerateConsoleUrlRoute, AssumeRoleRoute, ListAssumablesRoute, GetCurrentUserRoute } from '@/endpoints';

class AccessBridgeWorker extends AbstractWorker {
  protected readonly app: Hono<{ Bindings: Env }>;

  constructor() {
    super();

    const app: Hono<{
      Bindings: Env;
    }> = new Hono<{ Bindings: Env }>();

    app.use('*', cors());

    const openapi: HonoOpenAPIRouterType<{
      Bindings: Env;
    }> = fromHono(app, {
      docs_url: '/docs',
    });

    openapi.post('/api/aws/console', GenerateConsoleUrlRoute);
    openapi.post('/api/aws/assume-role', AssumeRoleRoute);
    openapi.get('/api/user/assumables', ListAssumablesRoute);
    openapi.get('/api/user/me', GetCurrentUserRoute);

    this.app = openapi;
  }

  protected async handleFetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return this.app.fetch(request, env, ctx);
  }

  protected async handleScheduled(_event: ScheduledController, _env: Env, _ctx: ExecutionContext): Promise<void> {
    // No scheduled tasks for AccessBridge
  }
}

export { AccessBridgeWorker };
