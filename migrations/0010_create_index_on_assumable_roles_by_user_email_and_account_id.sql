CREATE INDEX idx_assumable_roles_user_email_account
ON assumable_roles (user_email, aws_account_id);
