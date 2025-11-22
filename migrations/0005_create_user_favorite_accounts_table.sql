CREATE TABLE IF NOT EXISTS user_favorite_accounts (
    user_email VARCHAR(120),
    aws_account_id CHAR(12),
    PRIMARY KEY (user_email, aws_account_id),
    FOREIGN KEY (aws_account_id) REFERENCES aws_accounts(aws_account_id)
);
