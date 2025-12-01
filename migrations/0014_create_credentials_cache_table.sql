CREATE TABLE IF NOT EXISTS credentials_cache (
    principal_arn VARCHAR(256) PRIMARY KEY,
    encrypted_access_key_id VARCHAR(128) NOT NULL,
    encrypted_secret_access_key VARCHAR(256) NOT NULL,
    encrypted_session_token VARCHAR(2048) NOT NULL,
    salt VARCHAR(128) NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (principal_arn) REFERENCES credentials(principal_arn) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_credentials_cache_expires_at ON credentials_cache(expires_at);
