import { InternalServerError, UnauthorizedError } from '../error';
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
      throw new UnauthorizedError();
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
    let assumedBy: string = principalArn;
    let credential: Credential;
    do {
      credential = await this.getCredentialByPrincipalArn(assumedBy);
      if (credential.assumedBy) {
        assumedBy = credential.assumedBy;
      }
      trustChain.push(credential);
    } while (credential.assumedBy && credential.assumedBy.length > 0 && ++depth <= CredentialsDAO.ASSUME_ROLE_CHAIN_LIMIT);

    if (!credential.accessKeyId || !credential.secretAccessKey) {
      if (depth >= CredentialsDAO.ASSUME_ROLE_CHAIN_LIMIT) {
        console.error('Principal chain exceeds the maximum allowed depth.');
      }
      throw new InternalServerError('Principal chain is not valid. Contact system administrator.');
    }

    const principalArns: Array<string> = [];
    for (const trustedPrincipal of trustChain) {
      principalArns.push(trustedPrincipal.principalArn);
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
