import type { RoleConfig, RoleConfigInternal } from '@/model';

class RoleConfigsDAO {
  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  public async getRoleConfig(awsAccountId: string, roleName: string): Promise<RoleConfig | undefined> {
    const result: RoleConfigInternal | null = await this.database
      .prepare(
        'SELECT aws_account_id, role_name, destination_path, destination_region FROM role_configs WHERE aws_account_id = ? AND role_name = ?',
      )
      .bind(awsAccountId, roleName)
      .first<RoleConfigInternal>();
    if (result) {
      return {
        awsAccountId: result.aws_account_id,
        roleName: result.role_name,
        destinationPath: result.destination_path,
        destinationRegion: result.destination_region,
      };
    }
    return undefined;
  }
}

export { RoleConfigsDAO };
