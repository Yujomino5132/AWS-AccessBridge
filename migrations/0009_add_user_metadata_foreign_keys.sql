INSERT OR IGNORE INTO user_metadata (user_email, is_superadmin)
SELECT DISTINCT user_email, FALSE FROM assumable_roles
UNION
SELECT DISTINCT user_email, FALSE FROM user_favorite_accounts;

CREATE TABLE assumable_roles_new (
    user_email VARCHAR(120),
    aws_account_id CHAR(12),
    role_name VARCHAR(128),
    hidden BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_email, aws_account_id, role_name),
    FOREIGN KEY (user_email) REFERENCES user_metadata(user_email),
    FOREIGN KEY (aws_account_id) REFERENCES aws_accounts(aws_account_id)
);

INSERT INTO assumable_roles_new SELECT * FROM assumable_roles;
DROP TABLE assumable_roles;
ALTER TABLE assumable_roles_new RENAME TO assumable_roles;

CREATE TABLE user_favorite_accounts_new (
    user_email VARCHAR(120),
    aws_account_id CHAR(12),
    PRIMARY KEY (user_email, aws_account_id),
    FOREIGN KEY (user_email) REFERENCES user_metadata(user_email),
    FOREIGN KEY (aws_account_id) REFERENCES aws_accounts(aws_account_id)
);

INSERT INTO user_favorite_accounts_new SELECT * FROM user_favorite_accounts;
DROP TABLE user_favorite_accounts;
ALTER TABLE user_favorite_accounts_new RENAME TO user_favorite_accounts;
