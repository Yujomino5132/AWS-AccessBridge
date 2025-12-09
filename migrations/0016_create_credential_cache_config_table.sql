CREATE TABLE IF NOT EXISTS credential_cache_config (
    principal_arn VARCHAR(256) PRIMARY KEY,
    last_cached_at INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (principal_arn) REFERENCES credentials(principal_arn) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_credential_cache_last_cached_at ON credential_cache_config (last_cached_at ASC);
