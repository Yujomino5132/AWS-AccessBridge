import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';
import { CredentialsDAO } from '../../../../dao';
import { CredentialChain } from '../../../../model';

export class AssumeRoleRoute extends OpenAPIRoute {
  schema = {
    request: {
      parameters: [
        {
          name: 'principalArn',
          in: 'query',
          required: true,
          description: 'AWS access key ID',
          schema: { type: 'string' },
        },
      ],
    },
    responses: {
      '200': {
        description: 'Successfully generated AWS Console login URL',
        content: {
          'application/json': {
            schema: z.object({
              awsConsoleUrl: z.string().url(),
            }),
          },
        },
      },
      '400': {
        description: 'Missing or invalid request parameters',
      },
      '500': {
        description: 'Internal Server Error',
      },
    },
  };

  async handle(c: Context) {
    try {
      const principalArn = c.req.query('principalArn');

      // 参数校验
      if (!principalArn) {
        return c.text('Missing required query parameters', 400);
      }

      const credentialsDAO: CredentialsDAO = new CredentialsDAO(c.env.AccessBridgeDB);
      const credentialChain: CredentialChain = await credentialsDAO.getCredentialChainByPrincipalArn(principalArn);

      if (!credentialChain) {
        return c.text('Unauthorized', 403);
      }

      return c.json({ credentialChain });
    } catch (error) {
      console.error('Error generating AWS Console URL:', error);
      return c.text('Internal Server Error', 500);
    }
  }
}
