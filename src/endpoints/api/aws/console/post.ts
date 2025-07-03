import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';
import axios from 'axios';

export class GenerateConsoleUrlRoute extends OpenAPIRoute {
  schema = {
    tags: ['AWS'],
    summary: 'Generate AWS Console Login URL',
    description: 'Takes temporary AWS credentials and returns a federated AWS Console login URL.',
    parameters: [
      {
        name: 'accessKeyId',
        in: 'query',
        required: true,
        description: 'AWS access key ID',
        schema: { type: 'string' },
      },
      {
        name: 'secretAccessKey',
        in: 'query',
        required: true,
        description: 'AWS secret access key',
        schema: { type: 'string' },
      },
      {
        name: 'sessionToken',
        in: 'query',
        required: true,
        description: 'AWS session token',
        schema: { type: 'string' },
      },
    ],
    responses: {
      '200': {
        description: 'Successfully generated AWS Console login URL',
        content: {
          'application/json': {
            schema: z.object({
              awsConsoleUrl: z.string().url(),
            }),
          },
        },
      },
      '400': {
        description: 'Missing or invalid request parameters',
      },
      '500': {
        description: 'Internal Server Error',
      },
    },
  };

  async handle(c: Context) {
    try {
      const accessKeyId = c.req.query('accessKeyId');
      const secretAccessKey = c.req.query('secretAccessKey');
      const sessionToken = c.req.query('sessionToken');

      // 参数校验
      if (!accessKeyId || !secretAccessKey || !sessionToken) {
        return c.text('Missing required query parameters', 400);
      }

      const credentials: SessionCredentials = {
        sessionId: accessKeyId,
        sessionKey: secretAccessKey,
        sessionToken,
      };

      const signinToken = await getSigninToken(credentials);
      const loginUrl = buildLoginUrl(signinToken);

      return c.json({ awsConsoleUrl: loginUrl });
    } catch (error) {
      console.error('Error generating AWS Console URL:', error);
      return c.text('Internal Server Error', 500);
    }
  }
}

interface SessionCredentials {
  sessionId: string;
  sessionKey: string;
  sessionToken: string;
}

async function getSigninToken(session: SessionCredentials): Promise<string> {
  const sessionJson = JSON.stringify(session);
  const sessionEncoded = encodeURIComponent(sessionJson);

  const url = `https://signin.aws.amazon.com/federation?Action=getSigninToken&SessionType=json&Session=${sessionEncoded}`;
  const response = await axios.get(url);

  return response.data.SigninToken;
}

function buildLoginUrl(signinToken: string, destination = 'https://console.aws.amazon.com/'): string {
  const params = new URLSearchParams({
    Action: 'login',
    Issuer: 'example.com', // 可替换为您的系统标识
    Destination: destination,
    SigninToken: signinToken,
  });

  return `https://signin.aws.amazon.com/federation?${params.toString()}`;
}
