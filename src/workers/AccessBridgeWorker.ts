import { AbstractWorker } from '@/base';
import { fromHono, HonoOpenAPIRouterType } from 'chanfana';
import { Hono } from 'hono';
import {
  FavoriteAccountRoute,
  UnfavoriteAccountRoute,
  StoreCredentialRoute,
  RotateMasterKeyRoute,
  GenerateConsoleUrlRoute,
  AssumeRoleRoute,
  FederateRoute,
  ListAssumablesRoute,
  GetCurrentUserRoute,
  GrantAccessRoute,
  RevokeAccessRoute,
  SetAccountNicknameRoute,
  RemoveAccountNicknameRoute,
  StoreCredentialRelationshipRoute,
  RemoveCredentialRelationshipRoute,
  HideRoleRoute,
  UnhideRoleRoute,
  SetRoleConfigRoute,
  DeleteRoleConfigRoute,
} from '@/endpoints';
import { ExpiredCredentialsCleanupTask } from '@/scheduled';
import { MiddlewareHandlers } from '@/middleware';

class AccessBridgeWorker extends AbstractWorker {
  protected readonly app: Hono<{ Bindings: Env }>;

  constructor() {
    super();

    const app: Hono<{
      Bindings: Env;
    }> = new Hono<{ Bindings: Env }>();

    // Middleware Handlers
    app.use('*', MiddlewareHandlers.hmacValidation());

    const openapi: HonoOpenAPIRouterType<{
      Bindings: Env;
    }> = fromHono(app, {
      docs_url: '/docs',
    });

    // AWS Routes
    openapi.post('/api/aws/console', GenerateConsoleUrlRoute);
    openapi.post('/api/aws/assume-role', AssumeRoleRoute);
    openapi.get('/api/aws/federate', FederateRoute);

    // User Routes
    openapi.get('/api/user/assumables', ListAssumablesRoute);
    openapi.get('/api/user/me', GetCurrentUserRoute);
    openapi.post('/api/user/favorites', FavoriteAccountRoute);
    openapi.delete('/api/user/favorites', UnfavoriteAccountRoute);
    openapi.post('/api/user/assumable/hidden', HideRoleRoute);
    openapi.delete('/api/user/assumable/hidden', UnhideRoleRoute);

    // Admin Routes
    openapi.post('/api/admin/crypto/rotate-master-key', RotateMasterKeyRoute);
    openapi.post('/api/admin/credentials', StoreCredentialRoute);
    openapi.post('/api/admin/credentials/relationship', StoreCredentialRelationshipRoute);
    openapi.delete('/api/admin/credentials/relationship', RemoveCredentialRelationshipRoute);
    openapi.post('/api/admin/access', GrantAccessRoute);
    openapi.delete('/api/admin/access', RevokeAccessRoute);
    openapi.put('/api/admin/account/nickname', SetAccountNicknameRoute);
    openapi.delete('/api/admin/account/nickname', RemoveAccountNicknameRoute);
    openapi.put('/api/admin/role/config', SetRoleConfigRoute);
    openapi.delete('/api/admin/role/config', DeleteRoleConfigRoute);

    this.app = openapi;
  }

  protected async handleFetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return this.app.fetch(request, env, ctx);
  }

  protected async handleScheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    await new ExpiredCredentialsCleanupTask().handle(event, env, ctx);
  }
}

export { AccessBridgeWorker };
