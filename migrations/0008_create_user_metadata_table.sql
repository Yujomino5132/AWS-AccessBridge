CREATE TABLE IF NOT EXISTS user_metadata (
    user_email VARCHAR(120) PRIMARY KEY,
    is_superadmin BOOLEAN DEFAULT FALSE
);
