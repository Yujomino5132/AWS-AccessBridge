import { Context, Next } from 'hono';
import { INTERNAL_HEADER_PREFIX, INTERNAL_SIGNATURE_HEADER, INTERNAL_TIMESTAMP_HEADER } from '@/constants';
import { HTTPException } from 'hono/http-exception';
import { verifyHMACSignature, hashBody } from '@/crypto/hmac';

class HMACHandler {
  public static async validateInternalRequest(c: Context<{ Bindings: Env }>, next: Next): Promise<void> {
    const signature: string | undefined = c.req.header(INTERNAL_SIGNATURE_HEADER);
    const timestamp: string | undefined = c.req.header(INTERNAL_TIMESTAMP_HEADER);
    if (!signature || !timestamp) {
      throw new HTTPException(401, { message: 'Missing internal authentication headers' });
    }
    const now: number = Date.now();
    const requestTime: number = parseInt(timestamp);
    if (Math.abs(now - requestTime) > 1000) {
      throw new HTTPException(401, { message: 'Request timestamp outside valid window' });
    }
    const clonedRequest: Request = c.req.raw.clone();
    const body: string = await clonedRequest.text();
    const bodyHash: string = await hashBody(body);
    const path: string = new URL(c.req.url).pathname;
    const method: string = c.req.method;
    const headers: Record<string, string> = {};
    for (const [key, value] of c.req.raw.headers.entries()) {
      if (key.startsWith(INTERNAL_HEADER_PREFIX) && key !== INTERNAL_SIGNATURE_HEADER) {
        headers[key] = value;
      }
    }
    const secretStore: SecretsStoreSecret = c.env.INTERNAL_HMAC_SECRET;
    const secret: string = await secretStore.get();
    const isValid: boolean = await verifyHMACSignature(secret, signature, headers, timestamp, bodyHash, path, method);
    if (isValid) {
      await next();
      return;
    }
    throw new HTTPException(401, { message: 'Invalid internal signature' });
  }
}

export { HMACHandler };
