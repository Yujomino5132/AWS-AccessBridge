import { CredentialsCacheDAO } from '@/dao';
import { IScheduledTask } from './IScheduledTask';
import type { IEnv } from './IScheduledTask';

class ExpiredCredentialsCleanupTask extends IScheduledTask<ExpiredCredentialsCleanupTaskEnv> {
  protected async handleScheduledTask(
    _event: ScheduledController,
    env: ExpiredCredentialsCleanupTaskEnv,
    _ctx: ExecutionContext,
  ): Promise<void> {
    await new CredentialsCacheDAO(env.AccessBridgeDB).cleanupExpiredCredentials();
  }
}

interface ExpiredCredentialsCleanupTaskEnv extends IEnv {
  AccessBridgeDB: D1Database;
}

export { ExpiredCredentialsCleanupTask };
