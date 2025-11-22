class AwsAccountsDAO {
  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  public async ensureAccountExists(awsAccountId: string): Promise<void> {
    await this.database.prepare('INSERT OR IGNORE INTO aws_accounts (aws_account_id) VALUES (?)').bind(awsAccountId).run();
  }
}

export { AwsAccountsDAO };
