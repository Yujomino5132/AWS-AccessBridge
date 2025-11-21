ALTER TABLE credentials ADD COLUMN encrypted_access_key_id VARCHAR(128);
ALTER TABLE credentials ADD COLUMN encrypted_secret_access_key VARCHAR(256);
ALTER TABLE credentials ADD COLUMN encrypted_session_token VARCHAR(2048);
ALTER TABLE credentials ADD COLUMN salt VARCHAR(128);

ALTER TABLE credentials DROP COLUMN access_key_id;
ALTER TABLE credentials DROP COLUMN secret_access_key;
ALTER TABLE credentials DROP COLUMN session_token;
