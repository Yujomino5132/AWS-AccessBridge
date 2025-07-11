import { ActivityContext, IActivityAPIRoute, IEnv, IRequest, IResponse } from '../../../IActivityAPIRoute';

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
              type: 'object',
              required: ['email'],
              properties: {
                email: {
                  type: 'string',
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
      '500': {
        description: 'Internal server error while retrieving user information',
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
