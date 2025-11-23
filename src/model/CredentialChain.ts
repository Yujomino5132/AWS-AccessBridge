interface CredentialChain {
  principalArns: Array<string>;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string | undefined;
}

export type { CredentialChain };
