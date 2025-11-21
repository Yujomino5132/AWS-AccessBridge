import { ForbiddenError, InternalServerError, UnauthorizedError } from '@/error';
import { Credential, CredentialChain, CredentialInternal } from '@/model';
import { decryptDataOptional, encryptData } from '@/crypto/aes-gcm';

class CredentialsDAO {
  protected static readonly ASSUME_ROLE_CHAIN_LIMIT: number = 3;

  protected readonly database: D1Database;
  protected readonly masterKey: string;

  constructor(database: D1Database, masterKey: string) {
    this.database = database;
    this.masterKey = masterKey;
  }

  public async getCredentialByPrincipalArn(principalArn: string): Promise<Credential> {
    const result: CredentialInternal | null = await this.database
      .prepare(
        `SELECT principal_arn, assumed_by, encrypted_access_key_id, encrypted_secret_access_key, encrypted_session_token, salt
         FROM credentials
         WHERE principal_arn = ?
         LIMIT 1`,
      )
      .bind(principalArn)
      .first<CredentialInternal>();

    if (!result) {
      throw new UnauthorizedError();
    }

    return {
      principalArn: result.principal_arn,
      assumedBy: result.assumed_by,
      accessKeyId: await decryptDataOptional(result.encrypted_access_key_id, result.salt, this.masterKey),
      secretAccessKey: await decryptDataOptional(result.encrypted_secret_access_key, result.salt, this.masterKey),
      sessionToken: await decryptDataOptional(result.encrypted_session_token, result.salt, this.masterKey),
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
        console.error('Principal chain exceeds the maximum allowed depth: ', CredentialsDAO.ASSUME_ROLE_CHAIN_LIMIT);
      }
      throw new InternalServerError('Principal chain is not valid. Contact system administrator.');
    }

    if (trustChain.length <= 1) {
      throw new ForbiddenError('For security reasons, long-term credentials are not retrievable.');
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

  public async storeCredential(
    principalArn: string,
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken?: string | undefined,
  ): Promise<void> {
    const encryptedAccessKeyId: { encrypted: string; iv: string } = await encryptData(accessKeyId, this.masterKey);
    const encryptedSecretAccessKey: { encrypted: string; iv: string } = await encryptData(
      secretAccessKey,
      this.masterKey,
      encryptedAccessKeyId.iv,
    );
    const encryptedSessionToken: { encrypted: string; iv: string } | null = sessionToken
      ? await encryptData(sessionToken, this.masterKey, encryptedAccessKeyId.iv)
      : null;

    await this.database
      .prepare(
        `INSERT OR REPLACE INTO credentials (principal_arn, encrypted_access_key_id, encrypted_secret_access_key, encrypted_session_token, salt)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        principalArn,
        encryptedAccessKeyId.encrypted,
        encryptedSecretAccessKey.encrypted,
        encryptedSessionToken?.encrypted || null,
        encryptedAccessKeyId.iv,
      )
      .run();
  }
}

export { CredentialsDAO };
