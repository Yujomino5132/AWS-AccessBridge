import { AssumableRolesDAO } from '@/dao';
import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse } from '@/endpoints/IActivityAPIRoute';
import type { AssumableAccountsMap } from '@/model';

class ListAssumablesRoute extends IActivityAPIRoute<ListAssumablesRequest, ListAssumablesResponse, ListAssumablesEnv> {
  schema = {
    tags: ['User'],
    summary: 'List Assumable Roles',
    description:
      'Returns a list of AWS IAM roles that the authenticated user is authorized to assume, organized by AWS account ID. This endpoint helps users discover which roles they can access across different AWS accounts. By default, hidden roles are excluded from the results. Use the showHidden query parameter to include hidden roles.',
    parameters: [
      {
        name: 'showHidden',
        in: 'query' as const,
        description: 'Whether to include hidden roles in the results. Defaults to false.',
        required: false,
        schema: {
          type: 'boolean' as const,
          default: false,
        },
      },
    ],
    responses: {
      '200': {
        description: 'Successfully retrieved list of assumable roles',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              additionalProperties: {
                type: 'object' as const,
                properties: {
                  roles: {
                    type: 'array' as const,
                    items: {
                      type: 'string' as const,
                      minLength: 1,
                      maxLength: 64,
                      description: 'IAM Role name',
                    },
                  },
                  nickname: {
                    type: 'string' as const,
                    description: 'Optional AWS account nickname',
                  },
                  favorite: {
                    type: 'boolean' as const,
                    description: 'Whether this account is favorited by the user',
                  },
                },
                required: ['roles'],
              },
              description: 'Map of AWS Account IDs to objects containing role arrays and optional nicknames',
              example: {
                '123456789012': { roles: ['ReadOnlyRole', 'DeveloperRole', 'AdminRole'], nickname: 'Production', favorite: true },
                '987654321098': { roles: ['CrossAccountRole'], favorite: false },
                '555666777888': { roles: ['AuditorRole', 'ReadOnlyRole'], nickname: 'Development', favorite: true },
              },
            },
            examples: {
              'visible-roles-only': {
                summary: 'User with visible roles only (default behavior)',
                value: {
                  '123456789012': { roles: ['ReadOnlyRole', 'DeveloperRole'], nickname: 'Production', favorite: true },
                  '987654321098': { roles: ['AdminRole'], favorite: false },
                },
              },
              'with-hidden-roles': {
                summary: 'User with hidden roles included (showHidden=true)',
                value: {
                  '123456789012': { roles: ['ReadOnlyRole', 'DeveloperRole', 'HiddenRole'], nickname: 'Production', favorite: true },
                  '987654321098': { roles: ['AdminRole', 'AnotherHiddenRole'], favorite: false },
                },
              },
              'single-account': {
                summary: 'User with roles in one account',
                value: {
                  '123456789012': { roles: ['ReadOnlyRole', 'DeveloperRole', 'AdminRole'], nickname: 'Production', favorite: true },
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

    const url: URL = new URL(request.raw.url);
    const showHidden: boolean = url.searchParams.get('showHidden') === 'true';

    return assumableRolesDAO.getAllRolesByUserEmail(userEmail, showHidden);
  }
}

type ListAssumablesRequest = IRequest;

interface ListAssumablesResponse extends IResponse, AssumableAccountsMap {}

type ListAssumablesEnv = IEnv;

export { ListAssumablesRoute };
export type { ListAssumablesRequest, ListAssumablesResponse };
