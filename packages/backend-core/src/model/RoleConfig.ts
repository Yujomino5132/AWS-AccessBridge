interface RoleConfig {
  awsAccountId: string;
  roleName: string;
  destinationPath?: string | undefined;
  destinationRegion?: string | undefined;
  roleSessionDurationSeconds?: number | undefined;
}

interface RoleConfigInternal {
  aws_account_id: string;
  role_name: string;
  destination_path?: string | undefined;
  destination_region?: string | undefined;
  role_session_duration_seconds?: number | undefined;
}

export type { RoleConfig, RoleConfigInternal };
