interface UserMetadata {
  userEmail: string;
  isSuperAdmin: boolean;
}

interface UserMetadataInternal {
  user_email: string;
  is_superadmin: boolean;
}

export type { UserMetadata, UserMetadataInternal };
