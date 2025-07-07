import { z } from 'zod';
import { AssumableRolesDAO, CredentialsDAO } from '../../../../dao';
import { AccessKeysWithExpiration, CredentialChain } from '../../../../model';
import { ArnUtil, AssumeRoleUtil, EmailUtil } from '../../../../utils';
import { ActivityContext, IActivityAPIRoute, IEnv, IRequest, IResponse } from '../../../IActivityAPIRoute';
import { BadRequestError } from '../../../../error';

class AssumeRoleRoute extends IActivityAPIRoute<AssumeRoleRequest, AssumeRoleResponse, AssumeRoleEnv> {
  schema = {
    body: z.object({
      principalArn: z.string().min(1, 'principalArn is required'),
    }),
  };

  protected async handleRequest(
    request: AssumeRoleRequest,
    env: AssumeRoleEnv,
    cxt: ActivityContext<AssumeRoleEnv>,
  ): Promise<AssumeRoleResponse> {
    if (!request.principalArn) {
      throw new BadRequestError('Missing required fields.');
    }

    const userEmail: string = this.getAuthenticatedUserEmailAddress(cxt);
    const accountId: string = ArnUtil.getAccountIdFromArn(request.principalArn);
    const roleName: string = ArnUtil.getRoleNameFromArn(request.principalArn);

    await new AssumableRolesDAO(env.AccessBridgeDB).verifyUserHasAccessToRole(userEmail, accountId, roleName);

    const credentialsDAO: CredentialsDAO = new CredentialsDAO(env.AccessBridgeDB);
    const credentialChain: CredentialChain = await credentialsDAO.getCredentialChainByPrincipalArn(request.principalArn);

    let newCredentials: AccessKeysWithExpiration = {
      accessKeyId: credentialChain.accessKeyId,
      secretAccessKey: credentialChain.secretAccessKey,
    };

    const userId: string = EmailUtil.extractUsername(userEmail);
    for (let i = credentialChain.principalArns.length - 2; i >= 0; --i) {
      newCredentials = await AssumeRoleUtil.assumeRole(credentialChain.principalArns[i], newCredentials, `AccessBridge-${userId}`);
    }

    return newCredentials;
  }
}

interface AssumeRoleRequest extends IRequest {
  principalArn: string;
}

interface AssumeRoleResponse extends IResponse {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: string;
}

interface AssumeRoleEnv extends IEnv {
  AccessBridgeDB: D1Database;
}

export { AssumeRoleRoute };
