import { AssumableRolesDAO, CredentialsDAO } from '../../../../dao';
import { AccessKeysWithExpiration, CredentialChain } from '../../../../model';
import { ArnUtil, AssumeRoleUtil, EmailUtil } from '../../../../utils';
import { ActivityContext, IActivityAPIRoute, IEnv, IRequest, IResponse } from '../../../IActivityAPIRoute';
import { BadRequestError } from '../../../../error';

class AssumeRoleRoute extends IActivityAPIRoute<AssumeRoleRequest, AssumeRoleResponse, AssumeRoleEnv> {
  schema = {
    tags: ['AWS'],
    summary: 'Assume AWS IAM Role',
    description:
      "Assumes an AWS IAM role and returns temporary credentials. The user must have permission to assume the specified role, and the role must be configured in the system's credential chain. The returned credentials are temporary and will expire.",
    requestBody: {
      description: 'Role ARN to assume',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['principalArn'],
            properties: {
              principalArn: {
                type: 'string',
                minLength: 20,
                maxLength: 2048,
                pattern: '^arn:aws:iam::\\d{12}:role\\/[\\w+=,.@-]+$',
                description: 'AWS IAM Role ARN in format: arn:aws:iam::123456789012:role/RoleName',
                example: 'arn:aws:iam::123456789012:role/MyRole',
              },
            },
          },
          examples: {
            'standard-role': {
              summary: 'Assume a standard IAM role',
              value: {
                principalArn: 'arn:aws:iam::123456789012:role/DeveloperRole',
              },
            },
            'cross-account-role': {
              summary: 'Assume a cross-account role',
              value: {
                principalArn: 'arn:aws:iam::987654321098:role/CrossAccountAccessRole',
              },
            },
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Successfully assumed role and returned temporary credentials',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['accessKeyId', 'secretAccessKey'],
              properties: {
                accessKeyId: {
                  type: 'string',
                  minLength: 16,
                  maxLength: 128,
                  description: 'Temporary AWS Access Key ID (starts with ASIA for temporary credentials)',
                  example: 'ASIAIOSFODNN7EXAMPLE',
                },
                secretAccessKey: {
                  type: 'string',
                  minLength: 16,
                  maxLength: 128,
                  description: 'Temporary AWS Secret Access Key',
                  example: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                },
                sessionToken: {
                  type: 'string',
                  description: 'AWS Session Token for temporary credentials',
                  example: 'AQoEXAMPLEH4aoAH0gNCAPyJxz4BlCFFxWNE1OPTgk5TthT+FvwqnKwRcOIfrRh3c/LTo6UDdyJwOOvEVPvLXCrrrUtdnniCEXAMPLE',
                },
                expiration: {
                  type: 'string',
                  format: 'date-time',
                  description: 'ISO 8601 timestamp when credentials expire (typically 1 hour from issuance)',
                  example: '2024-01-15T14:30:00.000Z',
                },
              },
            },
            examples: {
              'temporary-credentials': {
                summary: 'Temporary credentials with expiration',
                value: {
                  accessKeyId: 'ASIAIOSFODNN7EXAMPLE',
                  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                  sessionToken: 'AQoEXAMPLEH4aoAH0gNCAPyJxz4BlCFFxWNE1OPTgk5TthT+FvwqnKwRcOIfrRh3c/LTo6UDdyJwOOvEVPvLXCrrrUtdnniCEXAMPLE',
                  expiration: '2024-01-15T14:30:00.000Z',
                },
              },
            },
          },
        },
      },
      '400': {
        description: 'Invalid request - malformed ARN or missing required fields',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                Exception: {
                  type: 'object',
                  properties: {
                    Type: {
                      type: 'string',
                      example: 'BadRequestError',
                    },
                    Message: {
                      type: 'string',
                      description: 'Details about the invalid request',
                      example: 'Missing required fields.',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '401': {
        description: 'Unauthorized - Missing authentication or invalid user',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                Exception: {
                  type: 'object',
                  properties: {
                    Type: {
                      type: 'string',
                      example: 'UnauthorizedError',
                    },
                    Message: {
                      type: 'string',
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
      '403': {
        description: 'Forbidden - User does not have permission to assume this role',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                Exception: {
                  type: 'object',
                  properties: {
                    Type: {
                      type: 'string',
                      example: 'ForbiddenError',
                    },
                    Message: {
                      type: 'string',
                      description: 'Permission denial details',
                      example: 'User does not have permission to assume role: arn:aws:iam::123456789012:role/RestrictedRole',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '404': {
        description: 'Role not found or not configured in credential chain',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                Exception: {
                  type: 'object',
                  properties: {
                    Type: {
                      type: 'string',
                      example: 'NotFoundError',
                    },
                    Message: {
                      type: 'string',
                      description: 'Role or credential chain not found',
                      example: 'Credential chain not found for principal ARN',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '500': {
        description: 'Internal server error during role assumption',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                Exception: {
                  type: 'object',
                  properties: {
                    Type: {
                      type: 'string',
                      example: 'InternalServerError',
                    },
                    Message: {
                      type: 'string',
                      description: 'Error description',
                      example: 'Failed to assume role due to AWS API error',
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
