import { Context } from 'hono';
import { z } from 'zod';
import { CredentialsDAO } from '../../../../dao';
import { CredentialChain } from '../../../../model';
import { AssumeRoleUtil } from '../../../../utils';
import { IActivityAPIRoute } from '../../../ActivityAPIRoute';

interface AssumeRoleRequest {
  principalArn: string;
}

interface AssumeRoleResponse {
  principalArn: string;
}

class AssumeRoleRoute extends IActivityAPIRoute<AssumeRoleRequest, AssumeRoleResponse> {
  schema = {
    body: z.object({
      principalArn: z.string().min(1, 'principalArn is required'),
    }),
  };

  async handle(c: Context) {
    try {
      const body = await c.req.json();
      const principalArn = body.principalArn;

      if (!principalArn) {
        return c.json({ error: 'Missing required field: principalArn' }, 400);
      }

      const credentialsDAO: CredentialsDAO = new CredentialsDAO(c.env.AccessBridgeDB);
      const credentialChain: CredentialChain = await credentialsDAO.getCredentialChainByPrincipalArn(principalArn);

      if (!credentialChain) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      if (credentialChain.principalArns.length === 1) {
        return c.json({ error: 'For security reasons, long-term credentials are not retrievable.' }, 400);
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

      return c.json({
        accessKeyId: newCredentials.AccessKeyId,
        secretAccessKey: newCredentials.SecretAccessKey,
        sessionToken: newCredentials.SessionToken,
        expiration: newCredentials.Expiration,
      });
    } catch (error) {
      console.error('Error assuming role:', error);
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  }
}

export { AssumeRoleRoute };
