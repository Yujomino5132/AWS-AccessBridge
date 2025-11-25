import { AssumableRolesDAO, AwsAccountsDAO } from '@/dao';
import { BadRequestError } from '@/error';
import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse } from '@/endpoints/IActivityAPIRoute';

class RevokeAccessRoute extends IActivityAPIRoute<RevokeAccessRequest, RevokeAccessResponse, RevokeAccessEnv> {
  schema = {
    tags: ['Admin'],
    summary: 'Revoke User Access to Role',
    description:
      "Revokes a user's permission to assume a specific AWS role in an account. This removes the mapping from the assumable_roles table, preventing the user from assuming the role through the AWS Access Bridge. If the AWS account does not exist in the database, it will be created automatically (though this is primarily for consistency). This operation is idempotent - revoking access from a role that a user doesn't have access to will not cause an error.",
    requestBody: {
      description: 'User access details to revoke',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object' as const,
            required: ['userEmail', 'awsAccountId', 'roleName'],
            properties: {
              userEmail: {
                type: 'string' as const,
                format: 'email',
                description: 'Email address of the user to revoke access from (must be a valid email format)',
                example: 'developer@example.com',
                maxLength: 120,
              },
              awsAccountId: {
                type: 'string' as const,
                pattern: '^[0-9]{12}$',
                description: 'AWS Account ID (exactly 12 digits)',
                example: '123456789012',
              },
              roleName: {
                type: 'string' as const,
                description: 'Name of the AWS IAM role to revoke access from (without ARN prefix)',
                example: 'DeveloperRole',
                maxLength: 128,
                minLength: 1,
              },
            },
          },
          examples: {
            'revoke-developer-access': {
              summary: 'Revoke developer access from a role',
              description: "Removes a developer's ability to assume a development role in a specific AWS account",
              value: {
                userEmail: 'developer@example.com',
                awsAccountId: '123456789012',
                roleName: 'DeveloperRole',
              },
            },
            'revoke-contractor-access': {
              summary: 'Revoke contractor access from a role',
              description: "Removes a contractor's access when their engagement ends",
              value: {
                userEmail: 'contractor@external.com',
                awsAccountId: '987654321098',
                roleName: 'ContractorRole',
              },
            },
            'revoke-temporary-access': {
              summary: 'Revoke temporary elevated access',
              description: 'Removes temporary admin access after incident resolution',
              value: {
                userEmail: 'engineer@example.com',
                awsAccountId: '555666777888',
                roleName: 'EmergencyAdminRole',
              },
            },
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Successfully revoked user access from the specified role',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              required: ['success', 'message'],
              properties: {
                success: {
                  type: 'boolean' as const,
                  description: 'Indicates if the operation was successful',
                  example: true,
                },
                message: {
                  type: 'string' as const,
                  description: 'Human-readable success message',
                  example: 'Access revoked successfully',
                },
              },
            },
            examples: {
              'access-revoked': {
                summary: 'Successful access revocation',
                value: {
                  success: true,
                  message: 'Access revoked successfully',
                },
              },
            },
          },
        },
      },
      '400': {
        description: 'Invalid request parameters - missing required fields or malformed data',
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
                      description: 'Details about the invalid request parameters',
                      example: 'Missing required fields.',
                    },
                  },
                },
              },
            },
            examples: {
              'missing-fields': {
                summary: 'Missing required fields',
                value: {
                  Exception: {
                    Type: 'BadRequestError',
                    Message: 'Missing required fields.',
                  },
                },
              },
              'invalid-email': {
                summary: 'Invalid email format',
                value: {
                  Exception: {
                    Type: 'BadRequestError',
                    Message: 'Invalid email format for userEmail.',
                  },
                },
              },
              'invalid-account-id': {
                summary: 'Invalid AWS Account ID',
                value: {
                  Exception: {
                    Type: 'BadRequestError',
                    Message: 'AWS Account ID must be exactly 12 digits.',
                  },
                },
              },
              'empty-role-name': {
                summary: 'Empty role name',
                value: {
                  Exception: {
                    Type: 'BadRequestError',
                    Message: 'Role name cannot be empty.',
                  },
                },
              },
            },
          },
        },
      },
      '401': {
        description: 'Unauthorized - Missing or invalid Cloudflare Access authentication',
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
                      example: 'UnauthorizedError',
                    },
                    Message: {
                      type: 'string' as const,
                      description: 'Authentication error details',
                      example: 'No authenticated user email provided in request headers.',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '500': {
        description: 'Internal server error during access revocation operation',
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
                      example: 'InternalServerError',
                    },
                    Message: {
                      type: 'string' as const,
                      description: 'Error description',
                      example: 'Failed to revoke user access from role in database',
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
    request: RevokeAccessRequest,
    env: RevokeAccessEnv,
    _cxt: ActivityContext<RevokeAccessEnv>,
  ): Promise<RevokeAccessResponse> {
    if (!request.userEmail || !request.awsAccountId || !request.roleName) {
      throw new BadRequestError('Missing required fields.');
    }

    const assumableRolesDAO = new AssumableRolesDAO(env.AccessBridgeDB);
    const accountsDAO = new AwsAccountsDAO(env.AccessBridgeDB);

    await accountsDAO.ensureAccountExists(request.awsAccountId);
    await assumableRolesDAO.revokeUserAccessToRole(request.userEmail, request.awsAccountId, request.roleName);

    return {
      success: true,
      message: 'Access revoked successfully',
    };
  }
}

interface RevokeAccessRequest extends IRequest {
  userEmail: string;
  awsAccountId: string;
  roleName: string;
}

interface RevokeAccessResponse extends IResponse {
  success: boolean;
  message: string;
}

interface RevokeAccessEnv extends IEnv {
  AccessBridgeDB: D1Database;
}

export { RevokeAccessRoute };
export type { RevokeAccessRequest, RevokeAccessResponse };
