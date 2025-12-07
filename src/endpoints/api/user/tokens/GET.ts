import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse } from '@/endpoints/IActivityAPIRoute';
import { UserAccessTokenDAO } from '@/dao';
import type { UserAccessTokenMetadata } from '@/model';

class ListTokensRoute extends IActivityAPIRoute<ListTokensRequest, ListTokensResponse, ListTokensEnv> {
  schema = {
    tags: ['User'],
    summary: 'List Personal Access Tokens',
    description: 'Lists all personal access tokens for the authenticated user',
    responses: {
      '200': {
        description: 'Tokens retrieved successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              properties: {
                tokens: {
                  type: 'array' as const,
                  items: {
                    type: 'object' as const,
                    properties: {
                      tokenId: { type: 'string' as const },
                      name: { type: 'string' as const },
                      createdAt: { type: 'number' as const },
                      expiresAt: { type: 'number' as const },
                      lastUsedAt: { type: 'number' as const },
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
    _request: ListTokensRequest,
    env: ListTokensEnv,
    cxt: ActivityContext<ListTokensEnv>,
  ): Promise<ListTokensResponse> {
    const userEmail: string = this.getAuthenticatedUserEmailAddress(cxt);
    const userAccessTokenDAO: UserAccessTokenDAO = new UserAccessTokenDAO(env.AccessBridgeDB);
    const tokens: UserAccessTokenMetadata[] = await userAccessTokenDAO.getByUserEmail(userEmail);
    return { tokens };
  }
}

type ListTokensRequest = IRequest;

interface ListTokensResponse extends IResponse {
  tokens: UserAccessTokenMetadata[];
}

type ListTokensEnv = IEnv;

export { ListTokensRoute };
export type { ListTokensRequest, ListTokensResponse };
