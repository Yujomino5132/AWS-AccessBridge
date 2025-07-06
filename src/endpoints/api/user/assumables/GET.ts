import { AssumableRolesDAO } from '../../../../dao';
import { IActivityAPIRoute, IEnv, IRequest, IResponse } from '../../../IActivityAPIRoute';
import { Context } from 'hono';

class ListAssumablesRoute extends IActivityAPIRoute<ListAssumablesRequest, ListAssumablesResponse, AListAssumablesEnv> {
  schema = {};

  protected async handleRequest(
    request: ListAssumablesRequest,
    env: AListAssumablesEnv,
    cxt: Context<AListAssumablesEnv>,
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

interface AListAssumablesEnv extends IEnv {
  AccessBridgeDB: D1Database;
}

export { ListAssumablesRoute };
