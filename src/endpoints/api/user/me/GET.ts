import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse } from '@/endpoints/IActivityAPIRoute';

class GetCurrentUserRoute extends IActivityAPIRoute<GetCurrentUserRequest, GetCurrentUserResponse, GetCurrentUserEnv> {
  schema = {
    tags: ['User'],
    summary: 'Get Current User Information',
    description:
      'Returns information about the currently authenticated user, including their email address extracted from Cloudflare Access headers. This endpoint is useful for displaying user context in the frontend application.',
    responses: {
      '200': {
        description: 'Successfully retrieved current user information',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              required: ['email'],
              properties: {
                email: {
                  type: 'string' as const,
                  format: 'email',
                  description: 'Email address of the authenticated user as provided by Cloudflare Access',
                  example: 'user@example.com',
                },
              },
            },
            examples: {
              'user-info': {
                summary: 'Current user information',
                value: {
                  email: 'john.doe@company.com',
                },
              },
              'admin-user': {
                summary: 'Admin user information',
                value: {
                  email: 'admin@company.com',
                },
              },
            },
          },
        },
      },
      '401': {
        description: 'Unauthorized - Missing or invalid authentication headers',
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
        description: 'Internal server error while retrieving user information',
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
                      example: 'Failed to extract user information from headers',
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
    request: GetCurrentUserRequest,
    env: GetCurrentUserEnv,
    cxt: ActivityContext<GetCurrentUserEnv>,
  ): Promise<GetCurrentUserResponse> {
    const userEmail: string = this.getAuthenticatedUserEmailAddress(cxt);
    return {
      email: userEmail,
    };
  }
}

type GetCurrentUserRequest = IRequest;

interface GetCurrentUserResponse extends IResponse {
  email: string;
}

type GetCurrentUserEnv = IEnv;

export { GetCurrentUserRoute };
export type { GetCurrentUserRequest, GetCurrentUserResponse };
