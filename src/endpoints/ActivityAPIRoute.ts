import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { DefaultInternalServerError, InternalServerError, IServiceError } from '../error';

abstract class IActivityAPIRoute<TRequest extends IRequest, TResponse extends IResponse> extends OpenAPIRoute {
  async handle(c: Context) {
    try {
      const body = await c.req.json();
      const request = body as TRequest;

      const response = await this.handleRequest(request);

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

  protected abstract handleRequest(request: TRequest): Promise<TResponse>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IRequest {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IResponse {}

export { IActivityAPIRoute };
export type { IRequest, IResponse };
