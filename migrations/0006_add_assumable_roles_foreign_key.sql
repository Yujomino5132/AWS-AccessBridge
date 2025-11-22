CREATE TABLE assumable_roles_new (
    user_email VARCHAR(120),
    aws_account_id CHAR(12),
    role_name VARCHAR(128),
    PRIMARY KEY (user_email, aws_account_id, role_name),
    FOREIGN KEY (aws_account_id) REFERENCES aws_accounts(aws_account_id)
);

INSERT INTO assumable_roles_new SELECT * FROM assumable_roles;
DROP TABLE assumable_roles;
ALTER TABLE assumable_roles_new RENAME TO assumable_roles;
