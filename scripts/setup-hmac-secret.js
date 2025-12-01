#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require('crypto');

function generateHMACSecret() {
  return crypto.randomBytes(32).toString('base64');
}

const secret = generateHMACSecret();
console.log('Generated HMAC Secret:');
console.log(secret);
console.log('\nTo set this secret, run:');
console.log(`npx wrangler secret-store put aws-access-bridge-internal-hmac-secret --store-id YOUR_STORE_ID`);
console.log('\nThen paste the secret when prompted.');
