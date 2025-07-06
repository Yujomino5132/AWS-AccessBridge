import { z } from 'zod';
import { CredentialsDAO } from '../../../../dao';
import { AccessKeysWithExpiration, CredentialChain } from '../../../../model';
import { AssumeRoleUtil, EmailUtils } from '../../../../utils';
import { IActivityAPIRoute, IEnv, IRequest, IResponse } from '../../../IActivityAPIRoute';
import { BadRequestError } from '../../../../error';
import { Context } from 'hono';

class ListAssumablesRoute extends IActivityAPIRoute<ListAssumablesRequest, ListAssumablesResponse, AListAssumablesEnv> {
  schema = {
    body: z.object({
      principalArn: z.string().min(1, 'principalArn is required'),
    }),
  };

  protected async handleRequest(
    request: ListAssumablesRequest,
    env: AListAssumablesEnv,
    cxt: Context<AListAssumablesEnv>,
  ): Promise<ListAssumablesResponse> {}
}

type ListAssumablesRequest = IRequest;

interface ListAssumablesResponse extends IResponse {
  [key: string]: string[];
}

type AListAssumablesEnv = IEnv;

export { ListAssumablesRoute };
