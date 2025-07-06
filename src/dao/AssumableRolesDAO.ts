class AssumableRolesDAO {
  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  /**
   * Retrieves a list of role names that the specified user can assume within the given AWS account.
   * @param userEmail The email address of the user.
   * @param awsAccountId The AWS account ID to query roles for.
   * @returns A list of role names the user is authorized to assume in the account.
   */
  public async getRolesByUserAndAccount(userEmail: string, awsAccountId: string): Promise<Array<string>> {
    const results = await this.database
      .prepare(
        `SELECT role_name
         FROM assumable_roles
         WHERE user_email = ?
           AND aws_account_id = ?`,
      )
      .bind(userEmail, awsAccountId)
      .all<{ role_name: string }>();

    if (!results || !results.results) {
      return [];
    }

    return results.results.map((row) => row.role_name);
  }

  /**
   * Retrieves all assumable roles for the specified user across all accessible AWS accounts.
   * @param userEmail The email address of the user.
   * @returns A map of AWS account IDs to arrays of role names.
   */
  public async getAllRolesByUserEmail(userEmail: string): Promise<Record<string, string[]>> {
    const results = await this.database
      .prepare(
        `SELECT aws_account_id, role_name
         FROM assumable_roles
         WHERE user_email = ?`,
      )
      .bind(userEmail)
      .all<{ aws_account_id: string; role_name: string }>();

    if (!results || !results.results) {
      return {};
    }

    const roleMap: Record<string, string[]> = {};
    for (const row of results.results) {
      if (!roleMap[row.aws_account_id]) {
        roleMap[row.aws_account_id] = [];
      }
      roleMap[row.aws_account_id].push(row.role_name);
    }

    return roleMap;
  }
}

export { AssumableRolesDAO };
