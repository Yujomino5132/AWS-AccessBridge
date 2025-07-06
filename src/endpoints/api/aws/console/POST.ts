import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';
import axios from 'axios';

const CredentialsSchema = z.object({
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  sessionToken: z.string(),
});

export class GenerateConsoleUrlRoute extends OpenAPIRoute {
  schema = {
    tags: ['AWS'],
    summary: 'Generate AWS Console Login URL',
    description: 'Takes temporary AWS credentials and returns a federated AWS Console login URL.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: CredentialsSchema,
        },
      },
    },
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
      const body = await c.req.json();
      const parsed = CredentialsSchema.safeParse(body);

      if (!parsed.success) {
        return c.text('Invalid request body parameters', 400);
      }

      const { accessKeyId, secretAccessKey, sessionToken } = parsed.data;

      const credentials: SessionCredentials = {
        sessionId: accessKeyId,
        sessionKey: secretAccessKey,
        sessionToken,
      };

      const signinToken = await getSigninToken(credentials);
      const loginUrl = buildLoginUrl(signinToken);

      return c.json({ url: loginUrl });
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
    Issuer: 'example.com',
    Destination: destination,
    SigninToken: signinToken,
  });

  return `https://signin.aws.amazon.com/federation?${params.toString()}`;
}
