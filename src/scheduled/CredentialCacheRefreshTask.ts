import { CredentialCacheConfigDAO, CredentialsCacheDAO, CredentialsDAO } from '@/dao';
import { AssumeRoleUtil, TimestampUtil } from '@/utils';
import { CredentialChain, CredentialCache, AccessKeys, AccessKeysWithExpiration } from '@/model';
import { IScheduledTask } from './IScheduledTask';
import type { IEnv } from './IScheduledTask';
import {
  CREDENTIAL_REFRESH_CUT_OFF_OFFSET_MINUTES,
  DEFAULT_PRINCIPAL_TRUST_CHAIN_LIMIT,
  NUMBER_OF_CREDENTIALS_TO_REFRESH,
} from '@/constants';

class CredentialCacheRefreshTask extends IScheduledTask<CredentialCacheRefreshTaskEnv> {
  protected async handleScheduledTask(
    _event: ScheduledController,
    env: CredentialCacheRefreshTaskEnv,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const cutoffTime: number = TimestampUtil.addMinutes(
      TimestampUtil.getCurrentUnixTimestampInSeconds(),
      CREDENTIAL_REFRESH_CUT_OFF_OFFSET_MINUTES,
    );
    const credentialCacheConfigDAO: CredentialCacheConfigDAO = new CredentialCacheConfigDAO(env.AccessBridgeDB);
    const masterKey: string = await env.AES_ENCRYPTION_KEY_SECRET.get();
    const principalTrustChainLimit: number = parseInt(env.PRINCIPAL_TRUST_CHAIN_LIMIT || DEFAULT_PRINCIPAL_TRUST_CHAIN_LIMIT);
    const credentialsDAO: CredentialsDAO = new CredentialsDAO(env.AccessBridgeDB, masterKey, principalTrustChainLimit);
    const credentialsCacheDAO: CredentialsCacheDAO = new CredentialsCacheDAO(env.AccessBridgeDB, masterKey);
    const principalArns: string[] = await credentialCacheConfigDAO.getPrincipalArnsNeedingUpdate(
      NUMBER_OF_CREDENTIALS_TO_REFRESH,
      cutoffTime,
    );
    for (const principalArn of principalArns) {
      const credentialChain: CredentialChain = await credentialsDAO.getCredentialChainByPrincipalArn(principalArn);
      let credential: AccessKeys = {
        accessKeyId: credentialChain.accessKeyId,
        secretAccessKey: credentialChain.secretAccessKey,
        sessionToken: credentialChain.sessionToken,
      };
      for (let i = credentialChain.principalArns.length - 2; i >= 0; i--) {
        const roleArn: string = credentialChain.principalArns[i];
        const assumedCredentials: AccessKeysWithExpiration = await AssumeRoleUtil.assumeRole(
          roleArn,
          credential,
          'AccessBridge-CredentialCacheRefresh',
        );
        if (assumedCredentials.sessionToken && assumedCredentials.expiration) {
          const credentialCache: CredentialCache = {
            principalArn,
            accessKeyId: assumedCredentials.accessKeyId,
            secretAccessKey: assumedCredentials.secretAccessKey,
            sessionToken: assumedCredentials.sessionToken,
            expiresAt: TimestampUtil.convertIsoToUnixTimestampInSeconds(assumedCredentials.expiration),
          };
          await Promise.all([
            credentialsCacheDAO.storeCachedCredential(credentialCache),
            credentialCacheConfigDAO.updateLastCachedTime(principalArn),
          ]);
        }
        credential = assumedCredentials;
      }
    }
  }
}

interface CredentialCacheRefreshTaskEnv extends IEnv {
  PRINCIPAL_TRUST_CHAIN_LIMIT?: string | undefined;
  AccessBridgeDB: D1Database;
  AES_ENCRYPTION_KEY_SECRET: SecretsStoreSecret;
}

export { CredentialCacheRefreshTask };
