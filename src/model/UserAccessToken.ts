interface UserAccessToken {
  tokenId: string;
  userEmail: string;
  accessToken: string;
  name: string;
  createdAt: number;
  expiresAt: number;
  lastUsedAt?: number | undefined;
}

interface UserAccessTokenInternal {
  token_id: string;
  user_email: string;
  access_token: string;
  name: string;
  created_at: number;
  expires_at: number;
  last_used_at?: number | undefined;
}

export type { UserAccessToken, UserAccessTokenInternal };
