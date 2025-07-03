interface Credential {
  principalArn: string;
  assumedBy: string | undefined;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  sessionToken: string | undefined;
}

interface CredentialInternal {
  principal_arn: string;
  assumed_by: string | undefined;
  access_key_id: string | undefined;
  secret_access_key: string | undefined;
  session_token: string | undefined;
}

export type { Credential, CredentialInternal };
