CREATE TABLE IF NOT EXISTS user_access_tokens (
    token_id VARCHAR(64) PRIMARY KEY,
    user_email VARCHAR(120) NOT NULL,
    access_token VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    last_used_at INTEGER,
    FOREIGN KEY (user_email) REFERENCES user_metadata(user_email) ON DELETE CASCADE
);

CREATE INDEX idx_user_access_tokens_user_email ON user_access_tokens(user_email);
CREATE INDEX idx_user_access_tokens_expires_at ON user_access_tokens(expires_at);
