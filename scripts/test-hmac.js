#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require('crypto');

async function generateHMACSignature(secret, headers, timestamp, bodyHash, path, method) {
  const internalHeaders = Object.entries(headers)
    .filter(([key]) => key.toLowerCase().startsWith('x-internal'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('\n');

  const payload = `${internalHeaders}\n${timestamp}\n${bodyHash}\n${path}\n${method}`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('base64');
}

async function hashBody(body) {
  const hash = crypto.createHash('sha256');
  hash.update(body);
  return hash.digest('base64');
}

async function testHMAC() {
  const secret = 'test-secret-key';
  const headers = {
    'X-Internal-User-Email': 'test@example.com',
    'X-Internal-Base-Url': 'https://example.com',
    'X-Internal-Timestamp': '1701462644783',
  };
  const timestamp = '1701462644783';
  const body = '{"principalArn":"arn:aws:iam::123456789012:role/TestRole"}';
  const bodyHash = await hashBody(body);
  const path = '/api/aws/assume-role';
  const method = 'POST';

  const signature = await generateHMACSignature(secret, headers, timestamp, bodyHash, path, method);

  console.log('Test HMAC Signature Generation:');
  console.log('Secret:', secret);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Timestamp:', timestamp);
  console.log('Body Hash:', bodyHash);
  console.log('Path:', path);
  console.log('Method:', method);
  console.log('Generated Signature:', signature);

  // Test verification
  const verifySignature = await generateHMACSignature(secret, headers, timestamp, bodyHash, path, method);
  console.log('Verification Match:', signature === verifySignature);
}

testHMAC().catch(console.error);
