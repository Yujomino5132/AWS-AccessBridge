import type { UserMetadataInternal } from '@/model';

class UserMetadataDAO {
  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  public async isSuperAdmin(userEmail: string): Promise<boolean> {
    const result: UserMetadataInternal | null = await this.database
      .prepare('SELECT is_superadmin FROM user_metadata WHERE user_email = ?')
      .bind(userEmail)
      .first<UserMetadataInternal>();
    return result?.is_superadmin ?? false;
  }

  public async getOrCreateFederationUsername(userEmail: string): Promise<string> {
    const result: UserMetadataInternal | null = await this.database
      .prepare('SELECT uuid FROM user_metadata WHERE user_email = ?')
      .bind(userEmail)
      .first<UserMetadataInternal>();
    if (result?.federation_username) {
      return result.federation_username;
    }
    const federationUsername: string = crypto.randomUUID().replace(/-/g, '').toUpperCase();
    await this.database
      .prepare('UPDATE user_metadata SET federation_username = ? WHERE user_email = ?')
      .bind(federationUsername, userEmail)
      .run();
    return federationUsername;
  }
}

export { UserMetadataDAO };
