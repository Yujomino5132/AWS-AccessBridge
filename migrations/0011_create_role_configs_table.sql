CREATE TABLE IF NOT EXISTS role_configs (
    aws_account_id CHAR(12),
    role_name VARCHAR(128),
    destination_url VARCHAR(512),
    destination_region VARCHAR(32),
    PRIMARY KEY (aws_account_id, role_name),
    FOREIGN KEY (aws_account_id) REFERENCES aws_accounts(aws_account_id)
);
