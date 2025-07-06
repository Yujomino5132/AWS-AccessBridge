-- AWS Credentials
CREATE TABLE IF NOT EXISTS credentials (
    principal_arn VARCHAR(256) PRIMARY KEY,
    assumed_by VARCHAR(256),
    access_key_id VARCHAR(128),
    secret_access_key VARCHAR(256),
    session_token VARCHAR(2048)
);

-- Accessable Accounts
CREATE TABLE IF NOT EXISTS accessable_accounts (
    user_email VARCHAR(120),
    aws_account_id CHAR(12),
    PRIMARY KEY (user_email, aws_account_id)
);

-- Assumable Roles
CREATE TABLE IF NOT EXISTS assumable_roles (
    user_email VARCHAR(120),
    aws_account_id CHAR(12),
    role_name VARCHAR(128),
    PRIMARY KEY (user_email, aws_account_id, role_name)
);
