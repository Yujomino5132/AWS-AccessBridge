export async function generateHMACSignature(
  secret: string,
  headers: Record<string, string>,
  timestamp: string,
  bodyHash: string,
  path: string,
  method: string,
): Promise<string> {
  const internalHeaders = Object.entries(headers)
    .filter(([key]) => key.toLowerCase().startsWith('x-internal'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('\n');

  const payload = `${internalHeaders}\n${timestamp}\n${bodyHash}\n${path}\n${method}`;

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verifyHMACSignature(
  secret: string,
  signature: string,
  headers: Record<string, string>,
  timestamp: string,
  bodyHash: string,
  path: string,
  method: string,
): Promise<boolean> {
  const expectedSignature = await generateHMACSignature(secret, headers, timestamp, bodyHash, path, method);
  return signature === expectedSignature;
}

export async function hashBody(body: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
