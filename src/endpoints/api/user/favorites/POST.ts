import { UserFavoriteAccountsDAO } from '@/dao';
import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse } from '@/endpoints/IActivityAPIRoute';

class FavoriteAccountRoute extends IActivityAPIRoute<FavoriteAccountRequest, FavoriteAccountResponse, FavoriteAccountEnv> {
  schema = {
    tags: ['User'],
    summary: 'Favorite AWS Account',
    description: "Add an AWS account to the user's favorites list",
    request: {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              required: ['awsAccountId'],
              properties: {
                awsAccountId: {
                  type: 'string' as const,
                  pattern: '^[0-9]{12}$',
                  description: 'AWS Account ID to favorite',
                },
              },
            },
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Account favorited successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              properties: {
                success: { type: 'boolean' as const },
              },
            },
          },
        },
      },
    },
    security: [{ CloudflareAccess: [] }],
  };

  protected async handleRequest(
    request: FavoriteAccountRequest,
    env: FavoriteAccountEnv,
    cxt: ActivityContext<FavoriteAccountEnv>,
  ): Promise<FavoriteAccountResponse> {
    const userEmail = this.getAuthenticatedUserEmailAddress(cxt);
    const dao = new UserFavoriteAccountsDAO(env.AccessBridgeDB);

    await dao.favoriteAccount(userEmail, request.awsAccountId);
    return { success: true };
  }
}

interface FavoriteAccountRequest extends IRequest {
  awsAccountId: string;
}

interface FavoriteAccountResponse extends IResponse {
  success: boolean;
}

interface FavoriteAccountEnv extends IEnv {
  AccessBridgeDB: D1Database;
}

export { FavoriteAccountRoute };
