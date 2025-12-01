interface CredentialCache {
  principalArn: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiresAt: number;
}

interface CredentialCacheInternal {
  principal_arn: string;
  encrypted_access_key_id: string;
  encrypted_secret_access_key: string;
  encrypted_session_token: string;
  salt: string;
  expires_at: number;
}

export type { CredentialCache, CredentialCacheInternal };
