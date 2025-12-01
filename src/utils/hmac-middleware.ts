import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verifyHMACSignature, hashBody } from '@/crypto/hmac';

export async function validateInternalRequest(c: Context<{ Bindings: Env }>, next: Next) {
  const signature = c.req.header('x-internal-signature');
  const timestamp = c.req.header('x-internal-timestamp');

  if (!signature || !timestamp) {
    throw new HTTPException(401, { message: 'Missing internal authentication headers' });
  }

  const now = Date.now();
  const requestTime = parseInt(timestamp);

  if (Math.abs(now - requestTime) > 1000) {
    throw new HTTPException(401, { message: 'Request timestamp outside valid window' });
  }

  const clonedRequest = c.req.raw.clone();
  const body = await clonedRequest.text();
  const bodyHash = await hashBody(body);
  const path = new URL(c.req.url).pathname;
  const method = c.req.method;

  const headers: Record<string, string> = {};
  for (const [key, value] of c.req.raw.headers.entries()) {
    if (key.startsWith('x-internal') && key !== 'x-internal-signature') {
      headers[key] = value;
    }
  }

  const secretStore = c.env.INTERNAL_HMAC_SECRET;
  if (!secretStore) {
    throw new HTTPException(500, { message: 'Internal HMAC secret not configured' });
  }

  const secret = await secretStore.get();
  if (!secret) {
    throw new HTTPException(500, { message: 'Internal HMAC secret not available' });
  }

  const isValid = await verifyHMACSignature(secret, signature, headers, timestamp, bodyHash, path, method);

  if (!isValid) {
    throw new HTTPException(401, { message: 'Invalid internal signature' });
  }

  await next();
}
