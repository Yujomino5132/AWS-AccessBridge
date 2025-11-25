class AwsAccountsDAO {
  protected readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  public async ensureAccountExists(awsAccountId: string): Promise<void> {
    await this.database.prepare('INSERT OR IGNORE INTO aws_accounts (aws_account_id) VALUES (?)').bind(awsAccountId).run();
  }

  public async setAccountNickname(awsAccountId: string, nickname: string): Promise<void> {
    await this.database
      .prepare('UPDATE aws_accounts SET aws_account_nickname = ? WHERE aws_account_id = ?')
      .bind(nickname, awsAccountId)
      .run();
  }

  public async removeAccountNickname(awsAccountId: string): Promise<void> {
    await this.database.prepare('UPDATE aws_accounts SET aws_account_nickname = NULL WHERE aws_account_id = ?').bind(awsAccountId).run();
  }
}

export { AwsAccountsDAO };
