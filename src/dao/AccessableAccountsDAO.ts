class AccessableAccountsDAO {
  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  /**
   * Retrieves the list of AWS account IDs that the specified user is allowed to access.
   * @param userEmail The email address of the user.
   * @returns A list of AWS account IDs associated with the user.
   */
  public async getAwsAccountIdsByUserEmail(userEmail: string): Promise<Array<string>> {
    const results = await this.database
      .prepare(
        `SELECT aws_account_id
           FROM accessable_accounts
           WHERE user_email = ?`,
      )
      .bind(userEmail)
      .all<{ aws_account_id: string }>();

    if (!results || !results.results) {
      return [];
    }

    return results.results.map((row) => row.aws_account_id);
  }
}

export { AccessableAccountsDAO };
