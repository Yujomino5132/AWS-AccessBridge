import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { DefaultInternalServerError, InternalServerError, IServiceError, UnauthorizedError } from '../error';

abstract class IActivityAPIRoute<TRequest extends IRequest, TResponse extends IResponse, TEnv extends IEnv> extends OpenAPIRoute {
  async handle(c: Context<TEnv>) {
    try {
      const userEmail: string | undefined = c.req.header('Cf-Access-Authenticated-User-Email');
      if (!userEmail) {
        throw new UnauthorizedError('No authenticated user email provided in request headers.');
      }
      c.set('AuthenticatedUserEmailAddress', userEmail);

      const body: unknown = await c.req.json();
      const request: TRequest = body as TRequest;
      const response: TResponse = await this.handleRequest(request, c.env as TEnv);
      return c.json(response);
    } catch (error: unknown) {
      if (!(error instanceof IServiceError) || error instanceof InternalServerError) {
        console.error('Caught service error during execution: ', error);
      }
      if (error instanceof IServiceError) {
        return c.json({ Exception: { Type: error.getErrorType(), Message: error.getErrorMessage() } }, error.getErrorCode());
      }
      return c.json(
        {
          Exception: { Type: DefaultInternalServerError.getErrorType(), Message: DefaultInternalServerError.getErrorMessage() },
        },
        DefaultInternalServerError.getErrorCode(),
      );
    }
  }

  protected abstract handleRequest(request: TRequest, env: TEnv): Promise<TResponse>;

  protected getAuthenticatedUserEmailAddress(c: Context<TEnv>):string{
    return c.get('AuthenticatedUserEmailAddress');
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IRequest {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IResponse {}

interface IEnv {
  Variables: {
    AuthenticatedUserEmailAddress: string;
  };
}

export { IActivityAPIRoute };
export type { IRequest, IResponse, IEnv };
