import { Credentials, CredentialsInternal } from '../model';

class CredentialsDAO {
  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  public async getCredentialsByPrincipalArn(principalArn: string): Promise<Credentials | undefined> {
    const result = await this.database
      .prepare(
        `SELECT principal_arn, assumed_by, access_key_id, secret_access_key, session_token
        FROM credentials
        WHERE principal_arn = ?`,
      )
      .bind(principalArn)
      .first<CredentialsInternal>();

    return result
      ? {
          principalArn: result.principal_arn,
          assumedBy: result.assumed_by,
          accessKeyId: result.access_key_id,
          secretAccessKey: result.secret_access_key,
          sessionToken: result.session_token,
        }
      : undefined;
  }
}

export { CredentialsDAO };
