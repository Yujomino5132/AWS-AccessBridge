interface Credentials {
  principalArn: string;
  assumedBy: string | undefined;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  sessionToken: string | undefined;
}

interface CredentialsInternal {
  principal_arn: string;
  assumed_by: string | undefined;
  access_key_id: string | undefined;
  secret_access_key: string | undefined;
  session_token: string | undefined;
}

export type { Credentials, CredentialsInternal };
