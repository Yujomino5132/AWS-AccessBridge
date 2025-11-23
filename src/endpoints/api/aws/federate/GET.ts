import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse, ExtendedResponse } from '@/endpoints/IActivityAPIRoute';
import { BadRequestError } from '@/error';
import type { AssumeRoleResponse } from '@/endpoints/api/aws/assume-role/POST';
import type { GenerateConsoleUrlResponse } from '@/endpoints/api/aws/console/POST';
import { INTERNAL_USER_EMAIL_HEADER, CONTENT_TYPE, APPLICATION_JSON, SELF_WORKER_BASE_URL } from '@/constants';
import { ErrorDeserializer } from '@/utils';

class FederateRoute extends IActivityAPIRoute<FederateRequest, FederateResponse, FederateEnv> {
  schema = {
    tags: ['AWS'],
    summary: 'Federate AWS Access',
    description: 'Assumes an AWS role and generates a console URL in a single request',
    parameters: [
      {
        name: 'awsAccountId',
        in: 'query' as const,
        required: true,
        schema: {
          type: 'string' as const,
          pattern: '^\\d{12}$',
          description: 'AWS Account ID (12 digits)',
          example: '123456789012',
        },
      },
      {
        name: 'role',
        in: 'query' as const,
        required: true,
        schema: {
          type: 'string' as const,
          description: 'AWS IAM Role name',
          example: 'DeveloperRole',
        },
      },
    ],
    responses: {
      '302': {
        description: 'Redirect to AWS Console URL',
        headers: {
          Location: {
            description: 'Pre-authenticated AWS Console URL that expires after 15 minutes',
            schema: {
              type: 'string' as const,
              format: 'uri',
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
    request: FederateRequest,
    env: FederateEnv,
    cxt: ActivityContext<FederateEnv>,
  ): Promise<ExtendedResponse<FederateResponse>> {
    const url: URL = new URL(request.raw.url);
    const awsAccountId: string | null = url.searchParams.get('awsAccountId');
    const role: string | null = url.searchParams.get('role');
    if (!awsAccountId || !role) {
      throw new BadRequestError('Missing required query parameters.');
    }
    const principalArn: string = `arn:aws:iam::${awsAccountId}:role/${role}`;
    const userEmail: string = this.getAuthenticatedUserEmailAddress(cxt);
    const assumeRoleResponse: Response = await env.SELF.fetch(`${SELF_WORKER_BASE_URL}/api/aws/assume-role`, {
      method: 'POST',
      headers: {
        [CONTENT_TYPE]: APPLICATION_JSON,
        [INTERNAL_USER_EMAIL_HEADER]: userEmail,
      },
      body: JSON.stringify({ principalArn }),
    });
    if (!assumeRoleResponse.ok) {
      throw await ErrorDeserializer.deserializeError(assumeRoleResponse);
    }
    const credentials: AssumeRoleResponse = await assumeRoleResponse.json();
    const consoleResponse: Response = await env.SELF.fetch(`${SELF_WORKER_BASE_URL}/api/aws/console`, {
      method: 'POST',
      headers: {
        [CONTENT_TYPE]: APPLICATION_JSON,
        [INTERNAL_USER_EMAIL_HEADER]: userEmail,
      },
      body: JSON.stringify({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      }),
    });
    if (!consoleResponse.ok) {
      throw await ErrorDeserializer.deserializeError(consoleResponse);
    }
    const consoleData: GenerateConsoleUrlResponse = await consoleResponse.json();
    return {
      statusCode: 302,
      headers: {
        Location: consoleData.url,
      },
    };
  }
}

type FederateRequest = IRequest;

type FederateResponse = IResponse;

interface FederateEnv extends IEnv {
  SELF: Fetcher;
}

export { FederateRoute };
export type { FederateRequest, FederateResponse };
