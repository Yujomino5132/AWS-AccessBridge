import { UnauthorizedError } from '@/error';
import type { AssumableAccountsMap } from '@/model';

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
   * @returns A map of AWS account IDs to objects containing roles and account nickname.
   */
  public async getAllRolesByUserEmail(userEmail: string): Promise<AssumableAccountsMap> {
    const results = await this.database
      .prepare(
        `SELECT ar.aws_account_id, ar.role_name, aa.aws_account_nickname, 
                CASE WHEN ufa.aws_account_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
         FROM assumable_roles ar
         LEFT JOIN aws_accounts aa ON ar.aws_account_id = aa.aws_account_id
         LEFT JOIN user_favorite_accounts ufa ON ar.aws_account_id = ufa.aws_account_id AND ufa.user_email = ?
         WHERE ar.user_email = ?`,
      )
      .bind(userEmail, userEmail)
      .all<{ aws_account_id: string; role_name: string; aws_account_nickname: string | null; is_favorite: number }>();

    if (!results || !results.results) {
      return {};
    }

    const roleMap: AssumableAccountsMap = {};
    for (const row of results.results) {
      if (!roleMap[row.aws_account_id]) {
        roleMap[row.aws_account_id] = {
          roles: [],
          nickname: row.aws_account_nickname || undefined,
          favorite: row.is_favorite === 1,
        };
      }
      roleMap[row.aws_account_id].roles.push(row.role_name);
    }

    return roleMap;
  }

  /**
   * Verifies whether the specified user has permission to assume a given role in a specific AWS account.
   * Throws an UnauthorizedError if the user does not have access.
   *
   * @param userEmail - The email address of the user.
   * @param awsAccountId - The AWS account ID.
   * @param roleName - The name of the role to verify.
   * @throws UnauthorizedError if the user is not authorized to assume the specified role in the given AWS account.
   */
  public async verifyUserHasAccessToRole(userEmail: string, awsAccountId: string, roleName: string): Promise<void> {
    const result: never | null = await this.database
      .prepare(
        `SELECT 1
         FROM assumable_roles
         WHERE user_email = ?
           AND aws_account_id = ?
           AND role_name = ?
         LIMIT 1`,
      )
      .bind(userEmail, awsAccountId, roleName)
      .first();

    if (!result) {
      throw new UnauthorizedError(`${userEmail} is not authorized to assume role '${roleName}' in AWS account ${awsAccountId}.`);
    }
    return;
  }
}

export { AssumableRolesDAO };
