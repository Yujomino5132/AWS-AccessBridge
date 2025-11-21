import { CredentialsDAO } from '@/dao';
import { BadRequestError } from '@/error';
import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse } from '@/endpoints/IActivityAPIRoute';

class StoreCredentialRoute extends IActivityAPIRoute<StoreCredentialRequest, StoreCredentialResponse, StoreCredentialEnv> {
  schema = {
    tags: ['Admin'],
    summary: 'Store AWS Credentials',
    description: 'Encrypts and stores AWS credentials in the database.',
    requestBody: {
      description: 'AWS credentials to store',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object' as const,
            required: ['principal_arn', 'access_key_id', 'secret_access_key'],
            properties: {
              principal_arn: {
                type: 'string' as const,
                description: 'AWS principal ARN',
              },
              access_key_id: {
                type: 'string' as const,
                description: 'AWS access key ID',
              },
              secret_access_key: {
                type: 'string' as const,
                description: 'AWS secret access key',
              },
              session_token: {
                type: 'string' as const,
                description: 'AWS session token (optional)',
              },
            },
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Successfully stored credentials',
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
                  example: 'Credentials stored successfully',
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
        description: 'Internal server error during credential storage',
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
                      example: 'Failed to store credentials in database',
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
    request: StoreCredentialRequest,
    env: StoreCredentialEnv,
    _cxt: ActivityContext<StoreCredentialEnv>,
  ): Promise<StoreCredentialResponse> {
    if (!request.principal_arn || !request.access_key_id || !request.secret_access_key) {
      throw new BadRequestError('Missing required fields.');
    }

    const masterKey: string = await env.AES_ENCRYPTION_KEY_SECRET.get();
    const credentialsDAO: CredentialsDAO = new CredentialsDAO(env.AccessBridgeDB, masterKey);

    await credentialsDAO.storeCredential(request.principal_arn, request.access_key_id, request.secret_access_key, request.session_token);

    return {
      success: true,
      message: 'Credentials stored successfully',
    };
  }
}

interface StoreCredentialRequest extends IRequest {
  principal_arn: string;
  access_key_id: string;
  secret_access_key: string;
  session_token?: string;
}

interface StoreCredentialResponse extends IResponse {
  success: boolean;
  message: string;
}

interface StoreCredentialEnv extends IEnv {
  AccessBridgeDB: D1Database;
  AES_ENCRYPTION_KEY_SECRET: SecretsStoreSecret;
}

export { StoreCredentialRoute };
