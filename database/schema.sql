CREATE TABLE IF NOT EXISTS credentials (
    principal_arn TEXT PRIMARY KEY,
    assumed_by TEXT,
    access_key_id TEXT,
    secret_access_key TEXT,
    session_token TEXT
);
