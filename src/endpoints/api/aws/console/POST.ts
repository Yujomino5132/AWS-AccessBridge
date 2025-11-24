import { AwsConsoleUtil } from '@/utils';
import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse } from '@/endpoints/IActivityAPIRoute';

class GenerateConsoleUrlRoute extends IActivityAPIRoute<GenerateConsoleUrlRequest, GenerateConsoleUrlResponse, GenerateConsoleUrlEnv> {
  schema = {
    tags: ['AWS'],
    summary: 'Generate AWS Console URL',
    description:
      'Generates a temporary AWS Console login URL using provided AWS credentials. The URL allows direct access to the AWS Management Console without requiring manual authentication. The generated URL expires after 15 minutes for security purposes.',
    requestBody: {
      description: 'AWS credentials required to generate the console URL',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object' as const,
            required: ['accessKeyId', 'secretAccessKey'],
            properties: {
              accessKeyId: {
                type: 'string' as const,
                minLength: 16,
                maxLength: 128,
                description: 'AWS Access Key ID (typically 20 characters starting with AKIA for permanent keys or ASIA for temporary keys)',
                example: 'AKIAIOSFODNN7EXAMPLE',
              },
              secretAccessKey: {
                type: 'string' as const,
                minLength: 16,
                maxLength: 128,
                description: 'AWS Secret Access Key (typically 40 characters)',
                example: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
              },
              sessionToken: {
                type: 'string' as const,
                description: 'AWS Session Token (required for temporary credentials from STS, typically 1000+ characters)',
                example: 'AQoEXAMPLEH4aoAH0gNCAPyJxz4BlCFFxWNE1OPTgk5TthT+FvwqnKwRcOIfrRh3c/LTo6UDdyJwOOvEVPvLXCrrrUtdnniCEXAMPLE',
              },
              awsAccountId: {
                type: 'string' as const,
                pattern: '^\\d{12}$',
                description: 'AWS Account ID (12 digits) - optional, used for federate URL generation',
                example: '123456789012',
              },
              roleName: {
                type: 'string' as const,
                description: 'AWS IAM Role name - optional, used for federate URL generation',
                example: 'DeveloperRole',
              },
            },
          },
          examples: {
            'permanent-credentials': {
              summary: 'Using permanent AWS credentials',
              value: {
                accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
                secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
              },
            },
            'temporary-credentials': {
              summary: 'Using temporary AWS credentials with session token',
              value: {
                accessKeyId: 'ASIAIOSFODNN7EXAMPLE',
                secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                sessionToken: 'AQoEXAMPLEH4aoAH0gNCAPyJxz4BlCFFxWNE1OPTgk5TthT+FvwqnKwRcOIfrRh3c/LTo6UDdyJwOOvEVPvLXCrrrUtdnniCEXAMPLE',
              },
            },
            'with-federate-params': {
              summary: 'Using credentials with federate URL generation parameters',
              value: {
                accessKeyId: 'ASIAIOSFODNN7EXAMPLE',
                secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                sessionToken: 'AQoEXAMPLEH4aoAH0gNCAPyJxz4BlCFFxWNE1OPTgk5TthT+FvwqnKwRcOIfrRh3c/LTo6UDdyJwOOvEVPvLXCrrrUtdnniCEXAMPLE',
                awsAccountId: '123456789012',
                roleName: 'DeveloperRole',
              },
            },
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Successfully generated AWS Console URL',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              required: ['url'],
              properties: {
                url: {
                  type: 'string' as const,
                  format: 'uri',
                  description: 'Pre-authenticated AWS Console URL that expires after 15 minutes',
                  example:
                    'https://signin.aws.amazon.com/federation?Action=login&Issuer=AccessBridge&Destination=https%3A%2F%2Fconsole.aws.amazon.com%2F&SigninToken=VCaXjShAlpsXGHeOP1HnSjxuJMd1c1YvwjKNsKGKigo',
                },
              },
            },
          },
        },
      },
      '400': {
        description: 'Invalid request parameters or missing required fields',
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
                      description: 'Details about the invalid request parameters',
                      example: 'Missing required field: accessKeyId',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '401': {
        description: 'Unauthorized - Missing or invalid Cloudflare Access authentication',
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
        description: 'Internal server error during URL generation',
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
                      example: 'Failed to generate AWS signin token',
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
    request: GenerateConsoleUrlRequest,
    _env: IEnv,
    cxt: ActivityContext<IEnv>,
  ): Promise<GenerateConsoleUrlResponse> {
    const signinToken: string = await AwsConsoleUtil.getSigninToken(request.accessKeyId, request.secretAccessKey, request.sessionToken);
    let federateUrl: string = this.getBaseUrl(cxt);
    if (request.awsAccountId && request.roleName) {
      federateUrl = `${federateUrl}/api/aws/federate?awsAccountId=${request.awsAccountId}&role=${request.roleName}`;
    }
    const loginUrl: string = AwsConsoleUtil.getLoginUrl(signinToken, federateUrl);
    return {
      url: loginUrl,
    };
  }
}

interface GenerateConsoleUrlRequest extends IRequest {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string | undefined;
  awsAccountId?: string | undefined;
  roleName?: string | undefined;
}

interface GenerateConsoleUrlResponse extends IResponse {
  url: string;
}

type GenerateConsoleUrlEnv = IEnv;

export { GenerateConsoleUrlRoute };
export type { GenerateConsoleUrlRequest, GenerateConsoleUrlResponse };
