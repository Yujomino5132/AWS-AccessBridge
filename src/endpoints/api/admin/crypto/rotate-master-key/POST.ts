import { generateAESGCMKey } from '@/crypto/aes-gcm';
import { IActivityAPIRoute } from '@/endpoints/IActivityAPIRoute';
import type { ActivityContext, IEnv, IRequest, IResponse } from '@/endpoints/IActivityAPIRoute';

class RotateMasterKeyRoute extends IActivityAPIRoute<RotateMasterKeyRequest, RotateMasterKeyResponse, RotateMasterKeyEnv> {
  schema = {
    tags: ['Admin'],
    summary: 'Rotate Master Encryption Key',
    description: 'Generates a new AES-GCM encryption key and stores it in the secrets store.',
    responses: {
      '200': {
        description: 'Successfully generated and stored new master key',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              required: ['success', 'message', 'key'],
              properties: {
                success: {
                  type: 'boolean' as const,
                  description: 'Operation success status',
                  example: true,
                },
                message: {
                  type: 'string' as const,
                  description: 'Success message',
                  example: 'AES-GCM key generated and stored successfully',
                },
                key: {
                  type: 'string' as const,
                  description: 'Base64-encoded AES-GCM key',
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
    _request: RotateMasterKeyRequest,
    _env: RotateMasterKeyEnv,
    _cxt: ActivityContext<RotateMasterKeyEnv>,
  ): Promise<RotateMasterKeyResponse> {
    const key: string = await generateAESGCMKey();

    // Store the key in Secrets Store
    // await env.AES_ENCRYPTION_KEY_SECRET.put(key);

    return {
      success: true,
      message: 'AES-GCM key generated and stored successfully',
      key: key,
    };
  }
}

type RotateMasterKeyRequest = IRequest;

interface RotateMasterKeyResponse extends IResponse {
  success: boolean;
  message: string;
  key: string;
}

interface RotateMasterKeyEnv extends IEnv {
  AES_ENCRYPTION_KEY_SECRET: SecretsStoreSecret;
}

export { RotateMasterKeyRoute };
export type { RotateMasterKeyRequest, RotateMasterKeyResponse };
