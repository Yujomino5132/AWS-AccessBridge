CREATE TABLE IF NOT EXISTS assumable_roles (
    user_email VARCHAR(120),
    aws_account_id CHAR(12),
    role_name VARCHAR(128),
    PRIMARY KEY (user_email, aws_account_id, role_name)
);
