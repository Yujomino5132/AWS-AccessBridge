import { generateHMACSignature, hashBody } from '@/crypto/hmac';
import { SELF_WORKER_BASE_URL, INTERNAL_BASE_URL_HEADER, INTERNAL_USER_EMAIL_HEADER } from '@/constants';

export async function makeInternalRequest(
  path: string,
  method: string,
  body: string | null,
  baseUrl: string,
  userEmail: string,
  hmacSecretStore: SecretsStoreSecret,
  selfFetcher: Fetcher,
  additionalHeaders: Record<string, string> = {},
): Promise<Response> {
  const hmacSecret = await hmacSecretStore.get();
  if (!hmacSecret) {
    throw new Error('HMAC secret not available');
  }

  const timestamp = Date.now().toString();
  const bodyHash = await hashBody(body || '');

  const headers: Record<string, string> = {
    [INTERNAL_BASE_URL_HEADER]: baseUrl,
    [INTERNAL_USER_EMAIL_HEADER]: userEmail,
    'x-internal-timestamp': timestamp,
    ...additionalHeaders,
  };

  console.log('makeInternalRequest Debug - headers for signature:', JSON.stringify(headers));
  console.log('makeInternalRequest Debug - timestamp:', timestamp);
  console.log('makeInternalRequest Debug - bodyHash:', bodyHash);
  console.log('makeInternalRequest Debug - path:', path);
  console.log('makeInternalRequest Debug - method:', method);

  const signature = await generateHMACSignature(hmacSecret, headers, timestamp, bodyHash, path, method);
  headers['x-internal-signature'] = signature;

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  return selfFetcher.fetch(`${SELF_WORKER_BASE_URL}${path}`, {
    method,
    headers,
    body,
  });
}
