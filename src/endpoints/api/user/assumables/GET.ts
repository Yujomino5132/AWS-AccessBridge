import { AssumableRolesDAO } from '../../../../dao';
import { IActivityAPIRoute, IEnv, IRequest, IResponse } from '../../../IActivityAPIRoute';
import { Context } from 'hono';

class ListAssumablesRoute extends IActivityAPIRoute<ListAssumablesRequest, ListAssumablesResponse, ListAssumablesEnv> {
  schema = {};

  protected async handleRequest(
    request: ListAssumablesRequest,
    env: ListAssumablesEnv,
    cxt: Context<ListAssumablesEnv>,
  ): Promise<ListAssumablesResponse> {
    const userEmail: string = this.getAuthenticatedUserEmailAddress(cxt);
    const assumableRolesDAO: AssumableRolesDAO = new AssumableRolesDAO(env.AccessBridgeDB);

    return assumableRolesDAO.getAllRolesByUserEmail(userEmail);
  }
}

type ListAssumablesRequest = IRequest;

interface ListAssumablesResponse extends IResponse {
  [key: string]: string[];
}

interface ListAssumablesEnv extends IEnv {
  AccessBridgeDB: D1Database;
}

export { ListAssumablesRoute };
