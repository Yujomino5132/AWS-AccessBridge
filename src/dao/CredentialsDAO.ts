import { Credential, CredentialChain, CredentialInternal } from '../model';

class CredentialsDAO {
  protected static readonly ASSUME_ROLE_CHAIN_LIMIT: number = 3;

  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  public async getCredentialByPrincipalArn(principalArn: string): Promise<Credential> {
    const result: CredentialInternal | null = await this.database
      .prepare(
        `SELECT principal_arn, assumed_by, access_key_id, secret_access_key, session_token
        FROM credentials
        WHERE principal_arn = ?`,
      )
      .bind(principalArn)
      .first<CredentialInternal>();

    if (!result) {
      throw new Error('PrincipalArn not found');
    }

    return {
      principalArn: result.principal_arn,
      assumedBy: result.assumed_by,
      accessKeyId: result.access_key_id,
      secretAccessKey: result.secret_access_key,
      sessionToken: result.session_token,
    };
  }

  public async getCredentialChainByPrincipalArn(principalArn: string): Promise<CredentialChain> {
    const trustChain: Array<Credential> = [];

    let depth: number = 0;
    let credential: Credential;
    do {
      credential = await this.getCredentialByPrincipalArn(principalArn);
      trustChain.push(credential);
    } while (credential.assumedBy !== undefined && credential.assumedBy.length > 0 && ++depth <= CredentialsDAO.ASSUME_ROLE_CHAIN_LIMIT);

    if (!credential.accessKeyId || !credential.secretAccessKey) {
      throw new Error('Unable to assume the beginning role');
    }

    const principalArns: Array<string> = [credential.principalArn];
    for (const principal of trustChain) {
      if (!principal.assumedBy) {
        break;
      }
      principalArns.push(principal.assumedBy);
    }
    return {
      principalArns: principalArns,
      accessKeyId: credential.accessKeyId,
      secretAccessKey: credential.secretAccessKey,
      sessionToken: credential.sessionToken,
    };
  }
}

export { CredentialsDAO };
