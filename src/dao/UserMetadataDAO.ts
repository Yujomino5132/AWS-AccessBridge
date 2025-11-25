import type { UserMetadataInternal } from '@/model';

class UserMetadataDAO {
  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  public async isSuperAdmin(userEmail: string): Promise<boolean> {
    const result = await this.database
      .prepare('SELECT is_superadmin FROM user_metadata WHERE user_email = ?')
      .bind(userEmail)
      .first<UserMetadataInternal>();

    return result?.is_superadmin ?? false;
  }
}

export { UserMetadataDAO };
