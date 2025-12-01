import { CredentialCache, CredentialCacheInternal } from '@/model/CredentialCache';
import { decryptData, encryptData } from '@/crypto/aes-gcm';
import { DatabaseError } from '@/error/DatabaseError';
import { TimestampUtil } from '@/utils/TimestampUtil';
import { InternalServerError } from '@/error';

class CredentialsCacheDAO {
  protected static readonly CREDENTIAL_EXPIRY_BUFFER_MINUTES: number = 10;
  protected static readonly ERROR_MESSAGE_MASTER_KEY_MISSING: string =
    'The operation cannot be completed because the master key is missing.';

  protected readonly database: D1Database;
  protected readonly masterKey?: string | undefined;

  constructor(database: D1Database, masterKey?: string | undefined) {
    this.database = database;
    this.masterKey = masterKey;
  }

  public async getCachedCredential(principalArn: string): Promise<CredentialCache | undefined> {
    if (this.masterKey) {
      const currentTime: number = TimestampUtil.getCurrentUnixTimestampInSeconds();
      const minExpirationTime: number = TimestampUtil.addMinutes(currentTime, CredentialsCacheDAO.CREDENTIAL_EXPIRY_BUFFER_MINUTES);
      const result: CredentialCacheInternal | null = await this.database
        .prepare(
          `SELECT principal_arn, encrypted_access_key_id, encrypted_secret_access_key, encrypted_session_token, salt, expires_at
         FROM credentials_cache
         WHERE principal_arn = ? AND expires_at > ?
         LIMIT 1`,
        )
        .bind(principalArn, minExpirationTime)
        .first<CredentialCacheInternal>();
      if (result) {
        return {
          principalArn: result.principal_arn,
          accessKeyId: await decryptData(result.encrypted_access_key_id, result.salt, this.masterKey),
          secretAccessKey: await decryptData(result.encrypted_secret_access_key, result.salt, this.masterKey),
          sessionToken: await decryptData(result.encrypted_session_token, result.salt, this.masterKey),
          expiresAt: result.expires_at,
        };
      }
      return undefined;
    } else {
      throw new InternalServerError(CredentialsCacheDAO.ERROR_MESSAGE_MASTER_KEY_MISSING);
    }
  }

  public async storeCachedCredential(credential: CredentialCache): Promise<void> {
    if (this.masterKey) {
      const { encrypted: encryptedAccessKeyId, iv } = await encryptData(credential.accessKeyId, this.masterKey);
      const { encrypted: encryptedSecretAccessKey } = await encryptData(credential.secretAccessKey, this.masterKey, iv);
      const { encrypted: encryptedSessionToken } = await encryptData(credential.sessionToken, this.masterKey, iv);
      const result: D1Result = await this.database
        .prepare(
          `INSERT OR REPLACE INTO credentials_cache 
         (principal_arn, encrypted_access_key_id, encrypted_secret_access_key, encrypted_session_token, salt, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(credential.principalArn, encryptedAccessKeyId, encryptedSecretAccessKey, encryptedSessionToken, iv, credential.expiresAt)
        .run();
      if (!result.success) {
        throw new DatabaseError(`Failed to store cached credential: ${result.error}`);
      }
    } else {
      throw new InternalServerError(CredentialsCacheDAO.ERROR_MESSAGE_MASTER_KEY_MISSING);
    }
  }

  public async cleanupExpiredCredentials(): Promise<void> {
    const result: D1Result = await this.database
      .prepare(`DELETE FROM credentials_cache WHERE expires_at <= ?`)
      .bind(TimestampUtil.getCurrentUnixTimestampInSeconds())
      .run();
    if (!result.success) {
      throw new DatabaseError(`Failed to cleanup expired credentials: ${result.error}`);
    }
  }
}

export { CredentialsCacheDAO };
