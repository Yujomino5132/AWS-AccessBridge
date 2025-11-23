import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse, ExtendedResponse } from '@/endpoints/IActivityAPIRoute';
import { BadRequestError } from '@/error';
import type { AssumeRoleResponse } from '@/endpoints/api/aws/assume-role/POST';
import type { GenerateConsoleUrlResponse } from '@/endpoints/api/aws/console/POST';
import { INTERNAL_USER_EMAIL_HEADER } from '@/constants';
import { SELF_WORKER_BASE_URL } from '@/constants';

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
        'Content-Type': 'application/json',
        [INTERNAL_USER_EMAIL_HEADER]: userEmail,
      },
      body: JSON.stringify({ principalArn }),
    });

    if (!assumeRoleResponse.ok) {
      throw new Error(`Failed to assume role: ${assumeRoleResponse.statusText}`);
    }

    const credentials: AssumeRoleResponse = await assumeRoleResponse.json();

    // Call console endpoint
    const consoleResponse: Response = await env.SELF.fetch(`${SELF_WORKER_BASE_URL}/api/aws/console`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [INTERNAL_USER_EMAIL_HEADER]: userEmail,
      },
      body: JSON.stringify({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      }),
    });

    if (!consoleResponse.ok) {
      throw new Error(`Failed to generate console URL: ${consoleResponse.statusText}`);
    }

    const consoleData: GenerateConsoleUrlResponse = await consoleResponse.json();

    return {
      body: { url: consoleData.url },
      statusCode: 302,
      headers: {
        Location: consoleData.url,
      },
    };
  }
}

type FederateRequest = IRequest;

interface FederateResponse extends IResponse {
  url: string;
}

interface FederateEnv extends IEnv {
  SELF: Fetcher;
}

export { FederateRoute };
export type { FederateRequest, FederateResponse };
