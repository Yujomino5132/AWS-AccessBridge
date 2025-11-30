ALTER TABLE role_configs ADD COLUMN destination_path VARCHAR(128);
ALTER TABLE role_configs DROP COLUMN destination_url;
