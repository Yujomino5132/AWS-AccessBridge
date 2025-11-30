interface RoleConfig {
  awsAccountId: string;
  roleName: string;
  destinationUrl?: string | undefined;
  destinationRegion?: string | undefined;
}

interface RoleConfigInternal {
  aws_account_id: string;
  role_name: string;
  destination_url?: string | undefined;
  destination_region?: string | undefined;
}

export type { RoleConfig, RoleConfigInternal };
