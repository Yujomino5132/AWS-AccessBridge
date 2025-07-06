import { IActivityAPIRoute, IEnv, IRequest, IResponse } from '../../../IActivityAPIRoute';
import { Context } from 'hono';

class GetCurrentUserRoute extends IActivityAPIRoute<GetCurrentUserRequest, GetCurrentUserResponse, GetCurrentUserEnv> {
  schema = {};

  protected async handleRequest(
    request: GetCurrentUserRequest,
    env: GetCurrentUserEnv,
    cxt: Context<GetCurrentUserEnv>,
  ): Promise<GetCurrentUserResponse> {
    const userEmail: string = this.getAuthenticatedUserEmailAddress(cxt);
    return {
      email: userEmail,
    };
  }
}

type GetCurrentUserRequest = IRequest;

interface GetCurrentUserResponse extends IResponse {
  email: string;
}

type GetCurrentUserEnv = IEnv;

export { GetCurrentUserRoute };
