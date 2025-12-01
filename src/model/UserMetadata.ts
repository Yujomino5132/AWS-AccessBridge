interface UserMetadata {
  userEmail: string;
  isSuperAdmin: boolean;
  federationUsername?: string | undefined;
}

interface UserMetadataInternal {
  user_email: string;
  is_superadmin: boolean;
  federation_username?: string | undefined;
}

export type { UserMetadata, UserMetadataInternal };
