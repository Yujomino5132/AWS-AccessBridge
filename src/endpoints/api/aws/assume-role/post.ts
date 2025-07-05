import { z } from 'zod';
import { CredentialsDAO } from '../../../../dao';
import { CredentialChain } from '../../../../model';
import { AssumeRoleUtil } from '../../../../utils';
import { IActivityAPIRoute } from '../../../IActivityAPIRoute';
import { BadRequestError, ForbiddenError } from '../../../../error';

interface AssumeRoleRequest {
  principalArn: string;
}

interface AssumeRoleResponse {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string | undefined;
  expiration: string | undefined;
}

interface AssumeRoleEnv {
  AccessBridgeDB: D1Database;
}

class AssumeRoleRoute extends IActivityAPIRoute<AssumeRoleRequest, AssumeRoleResponse, AssumeRoleEnv> {
  schema = {
    body: z.object({
      principalArn: z.string().min(1, 'principalArn is required'),
    }),
  };

  protected async handleRequest(request: AssumeRoleRequest, env: AssumeRoleEnv): Promise<AssumeRoleResponse> {
    if (!request.principalArn) {
      throw new BadRequestError('Missing required fields.');
    }
    const credentialsDAO: CredentialsDAO = new CredentialsDAO(env.AccessBridgeDB);
    const credentialChain: CredentialChain = await credentialsDAO.getCredentialChainByPrincipalArn(request.principalArn);

    if (!credentialChain) {
      throw new ForbiddenError('Unauthorized');
    }

    if (credentialChain.principalArns.length === 1) {
      throw new BadRequestError('For security reasons, long-term credentials are not retrievable.');
    }

    let newCredentials: {
      AccessKeyId: string;
      SecretAccessKey: string;
      SessionToken?: string;
      Expiration?: string;
    } = {
      AccessKeyId: credentialChain.accessKeyId,
      SecretAccessKey: credentialChain.secretAccessKey,
    };

    for (let i = credentialChain.principalArns.length - 2; i >= 0; --i) {
      newCredentials = await AssumeRoleUtil.assumeRole(
        newCredentials.AccessKeyId,
        newCredentials.SecretAccessKey,
        credentialChain.principalArns[i],
        newCredentials.SessionToken,
        'us-east-1',
      );
    }
    return {
      accessKeyId: newCredentials.AccessKeyId,
      secretAccessKey: newCredentials.SecretAccessKey,
      sessionToken: newCredentials.SessionToken,
      expiration: newCredentials.Expiration,
    };
  }
}

export { AssumeRoleRoute };
