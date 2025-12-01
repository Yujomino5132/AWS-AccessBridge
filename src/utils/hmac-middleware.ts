import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verifyHMACSignature, hashBody } from '@/crypto/hmac';

export async function validateInternalRequest(c: Context<{ Bindings: Env }>, next: Next) {
  const signature = c.req.header('X-Internal-Signature');
  const timestamp = c.req.header('X-Internal-Timestamp');

  console.log('HMAC Debug - signature:', signature);
  console.log('HMAC Debug - timestamp:', timestamp);

  if (!signature || !timestamp) {
    console.log('HMAC Debug - Missing headers');
    throw new HTTPException(401, { message: 'Missing internal authentication headers' });
  }

  const now = Date.now();
  const requestTime = parseInt(timestamp);

  console.log('HMAC Debug - now:', now, 'requestTime:', requestTime, 'diff:', Math.abs(now - requestTime));

  if (Math.abs(now - requestTime) > 1000) {
    console.log('HMAC Debug - Timestamp outside window');
    throw new HTTPException(401, { message: 'Request timestamp outside valid window' });
  }

  // Clone the request to avoid consuming the body
  const clonedRequest = c.req.raw.clone();
  const body = await clonedRequest.text();
  const bodyHash = await hashBody(body);
  const path = new URL(c.req.url).pathname;
  const method = c.req.method;

  console.log('HMAC Debug - body:', body);
  console.log('HMAC Debug - bodyHash:', bodyHash);
  console.log('HMAC Debug - path:', path);
  console.log('HMAC Debug - method:', method);

  const headers: Record<string, string> = {};
  console.log('HMAC Debug - all headers:');
  for (const [key, value] of c.req.raw.headers.entries()) {
    console.log(`  ${key}: ${value}`);
    console.log(`  key.startsWith('x-internal'): ${key.startsWith('x-internal')}`);
    console.log(`  key !== 'x-internal-signature': ${key !== 'x-internal-signature'}`);
    if (key.startsWith('x-internal') && key !== 'x-internal-signature') {
      console.log(`  Adding header: ${key} = ${value}`);
      headers[key] = value;
    }
  }

  console.log('HMAC Debug - internal headers:', JSON.stringify(headers));

  const secretStore = c.env.INTERNAL_HMAC_SECRET;
  if (!secretStore) {
    console.log('HMAC Debug - No secret store');
    throw new HTTPException(500, { message: 'Internal HMAC secret not configured' });
  }

  const secret = await secretStore.get();
  if (!secret) {
    console.log('HMAC Debug - No secret value');
    throw new HTTPException(500, { message: 'Internal HMAC secret not available' });
  }

  console.log('HMAC Debug - secret length:', secret.length);

  const isValid = await verifyHMACSignature(secret, signature, headers, timestamp, bodyHash, path, method);

  console.log('HMAC Debug - isValid:', isValid);

  if (!isValid) {
    throw new HTTPException(401, { message: 'Invalid internal signature' });
  }

  await next();
}
