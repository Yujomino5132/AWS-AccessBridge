import { AssumableRolesDAO } from '../../../../dao';
import { ActivityContext, IActivityAPIRoute, IEnv, IRequest, IResponse } from '../../../IActivityAPIRoute';

class ListAssumablesRoute extends IActivityAPIRoute<ListAssumablesRequest, ListAssumablesResponse, ListAssumablesEnv> {
  schema = {
    tags: ['User'],
    summary: 'List Assumable Roles',
    description:
      'Returns a list of AWS IAM roles that the authenticated user is authorized to assume, organized by AWS account ID. This endpoint helps users discover which roles they can access across different AWS accounts.',
    responses: {
      '200': {
        description: 'Successfully retrieved list of assumable roles',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              additionalProperties: {
                type: 'array' as const,
                items: {
                  type: 'string' as const,
                  minLength: 1,
                  maxLength: 64,
                  description: 'IAM Role name',
                },
              },
              description: 'Map of AWS Account IDs (12-digit strings) to arrays of role names the user can assume',
              example: {
                '123456789012': ['ReadOnlyRole', 'DeveloperRole', 'AdminRole'],
                '987654321098': ['CrossAccountRole'],
                '555666777888': ['AuditorRole', 'ReadOnlyRole'],
              },
            },
            examples: {
              'single-account': {
                summary: 'User with roles in one account',
                value: {
                  '123456789012': ['ReadOnlyRole', 'DeveloperRole', 'AdminRole'],
                },
              },
              'multi-account': {
                summary: 'User with roles across multiple accounts',
                value: {
                  '123456789012': ['ReadOnlyRole', 'DeveloperRole'],
                  '987654321098': ['AdminRole'],
                  '555666777888': ['AuditorRole', 'ReadOnlyRole'],
                },
              },
              'no-roles': {
                summary: 'User with no assumable roles',
                value: {},
              },
            },
          },
        },
      },
      '401': {
        description: 'Unauthorized - Missing or invalid authentication',
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
        description: 'Internal server error while retrieving roles',
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
                      example: 'Database error while retrieving assumable roles',
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
    request: ListAssumablesRequest,
    env: ListAssumablesEnv,
    cxt: ActivityContext<ListAssumablesEnv>,
  ): Promise<ListAssumablesResponse> {
    const userEmail: string = this.getAuthenticatedUserEmailAddress(cxt);
    const assumableRolesDAO: AssumableRolesDAO = new AssumableRolesDAO(env.AccessBridgeDB);

    return assumableRolesDAO.getAllRolesByUserEmail(userEmail);
  }
}

type ListAssumablesRequest = IRequest;

interface ListAssumablesResponse extends IResponse {
  [key: string]: string[];
}

interface ListAssumablesEnv extends IEnv {
  AccessBridgeDB: D1Database;
}

export { ListAssumablesRoute };
