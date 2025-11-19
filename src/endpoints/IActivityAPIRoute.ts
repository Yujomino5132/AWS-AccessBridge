import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { DefaultInternalServerError, InternalServerError, IServiceError, UnauthorizedError } from '@/error';

abstract class IActivityAPIRoute<TRequest extends IRequest, TResponse extends IResponse, TEnv extends IEnv> extends OpenAPIRoute {
  async handle(c: ActivityContext<TEnv>) {
    try {
      const userEmail: string | undefined = c.req.header('Cf-Access-Authenticated-User-Email');
      if (!userEmail) {
        throw new UnauthorizedError('No authenticated user email provided in request headers.');
      }
      c.set('AuthenticatedUserEmailAddress', userEmail);

      let body: unknown = {};
      try {
        body = await c.req.json();
      } catch {
        body = {};
      }
      const request: TRequest = { ...(body as TRequest), raw: c.req };
      const response: TResponse = await this.handleRequest(request, c.env as TEnv, c);
      return c.json(response);
    } catch (error: unknown) {
      if (error instanceof IServiceError) {
        console.warn(`Responding with ${error.getErrorType()}Error: `, error.stack);
        return c.json({ Exception: { Type: error.getErrorType(), Message: error.getErrorMessage() } }, error.getErrorCode());
      }
      if (!(error instanceof IServiceError) || error instanceof InternalServerError) {
        console.error('Caught service error during execution: ', error);
      }
      console.warn('Responding with DefaultInternalServerError: ', DefaultInternalServerError);
      return c.json(
        {
          Exception: { Type: DefaultInternalServerError.getErrorType(), Message: DefaultInternalServerError.getErrorMessage() },
        },
        DefaultInternalServerError.getErrorCode(),
      );
    }
  }

  protected abstract handleRequest(request: TRequest, env: TEnv, cxt: ActivityContext<TEnv>): Promise<TResponse>;

  protected getAuthenticatedUserEmailAddress(c: ActivityContext<TEnv>): string {
    return c.get('AuthenticatedUserEmailAddress');
  }
}

interface IRequest {
  raw: Request;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IResponse {}

interface IEnv {
  Variables: {
    AuthenticatedUserEmailAddress: string;
  };
}

type ActivityContext<TEnv extends IEnv> = Context<{ Bindings: Env } & TEnv>;

export { IActivityAPIRoute };
export type { IRequest, IResponse, IEnv, ActivityContext };
