import { AssumableRolesDAO, AwsAccountsDAO } from '@/dao';
import { BadRequestError } from '@/error';
import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse } from '@/endpoints/IActivityAPIRoute';

class GrantAccessRoute extends IActivityAPIRoute<GrantAccessRequest, GrantAccessResponse, GrantAccessEnv> {
  schema = {
    tags: ['Admin'],
    summary: 'Grant User Access to Role',
    description: 'Grants a user permission to assume a specific AWS role in an account.',
    requestBody: {
      description: 'User access details to grant',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object' as const,
            required: ['userEmail', 'awsAccountId', 'roleName'],
            properties: {
              userEmail: {
                type: 'string' as const,
                description: 'Email address of the user to grant access to',
                format: 'email',
              },
              awsAccountId: {
                type: 'string' as const,
                description: 'AWS account ID (12 digits)',
                pattern: '^[0-9]{12}$',
              },
              roleName: {
                type: 'string' as const,
                description: 'Name of the AWS role',
              },
            },
          },
          examples: {
            'grant-developer-access': {
              summary: 'Grant developer access to a role',
              value: {
                userEmail: 'developer@example.com',
                awsAccountId: '123456789012',
                roleName: 'DeveloperRole',
              },
            },
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Successfully granted access',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              required: ['success', 'message'],
              properties: {
                success: {
                  type: 'boolean' as const,
                  example: true,
                },
                message: {
                  type: 'string' as const,
                  example: 'Access granted successfully',
                },
              },
            },
          },
        },
      },
      '400': {
        description: 'Invalid request - missing required fields',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              properties: {
                Exception: {
                  type: 'object' as const,
                  properties: {
                    Type: {
                      type: 'string' as const,
                      example: 'BadRequestError',
                    },
                    Message: {
                      type: 'string' as const,
                      example: 'Missing required fields.',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        CloudflareAccess: [],
      },
    ],
  };

  protected async handleRequest(
    request: GrantAccessRequest,
    env: GrantAccessEnv,
    _cxt: ActivityContext<GrantAccessEnv>,
  ): Promise<GrantAccessResponse> {
    if (!request.userEmail || !request.awsAccountId || !request.roleName) {
      throw new BadRequestError('Missing required fields.');
    }

    const assumableRolesDAO = new AssumableRolesDAO(env.AccessBridgeDB);
    const accountsDAO = new AwsAccountsDAO(env.AccessBridgeDB);

    await accountsDAO.ensureAccountExists(request.awsAccountId);
    await assumableRolesDAO.grantUserAccessToRole(request.userEmail, request.awsAccountId, request.roleName);

    return {
      success: true,
      message: 'Access granted successfully',
    };
  }
}

interface GrantAccessRequest extends IRequest {
  userEmail: string;
  awsAccountId: string;
  roleName: string;
}

interface GrantAccessResponse extends IResponse {
  success: boolean;
  message: string;
}

interface GrantAccessEnv extends IEnv {
  AccessBridgeDB: D1Database;
}

export { GrantAccessRoute };
export type { GrantAccessRequest, GrantAccessResponse };
