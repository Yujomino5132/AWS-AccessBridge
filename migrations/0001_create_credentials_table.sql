CREATE TABLE IF NOT EXISTS credentials (
    principal_arn VARCHAR(256) PRIMARY KEY,
    assumed_by VARCHAR(256),
    access_key_id VARCHAR(128),
    secret_access_key VARCHAR(256),
    session_token VARCHAR(2048)
);
