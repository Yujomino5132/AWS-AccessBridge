import { z } from 'zod';
import { CredentialsDAO } from '../../../../dao';
import { AccessKeysWithExpiration, CredentialChain } from '../../../../model';
import { AssumeRoleUtil, EmailUtils } from '../../../../utils';
import { IActivityAPIRoute, IEnv, IRequest, IResponse } from '../../../IActivityAPIRoute';
import { BadRequestError } from '../../../../error';
import { Context } from 'hono';

class AssumeRoleRoute extends IActivityAPIRoute<AssumeRoleRequest, AssumeRoleResponse, AssumeRoleEnv> {
  schema = {
    body: z.object({
      principalArn: z.string().min(1, 'principalArn is required'),
    }),
  };

  protected async handleRequest(request: AssumeRoleRequest, env: AssumeRoleEnv, cxt: Context<AssumeRoleEnv>): Promise<AssumeRoleResponse> {
    if (!request.principalArn) {
      throw new BadRequestError('Missing required fields.');
    }
    const credentialsDAO: CredentialsDAO = new CredentialsDAO(env.AccessBridgeDB);
    const credentialChain: CredentialChain = await credentialsDAO.getCredentialChainByPrincipalArn(request.principalArn);

    if (credentialChain.principalArns.length === 1) {
      throw new BadRequestError('For security reasons, long-term credentials are not retrievable.');
    }

    let newCredentials: AccessKeysWithExpiration = {
      accessKeyId: credentialChain.accessKeyId,
      secretAccessKey: credentialChain.secretAccessKey,
    };

    const userEmail: string = this.getAuthenticatedUserEmailAddress(cxt);
    const userId: string = EmailUtils.extractUsername(userEmail);
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
