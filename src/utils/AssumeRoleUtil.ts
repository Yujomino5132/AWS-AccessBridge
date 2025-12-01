import { AwsClient } from 'aws4fetch';
import { AccessKeys, AccessKeysWithExpiration } from '@/model';
import { InternalServerError, UnauthorizedError } from '@/error';

class AssumeRoleUtil {
  public static async assumeRole(
    roleArn: string,
    accessKeys: AccessKeys,
    sessionName: string,
    region: string = 'us-east-1',
  ): Promise<AccessKeysWithExpiration> {
    const stsClient: AwsClient = new AwsClient({
      service: 'sts',
      region: region,
      accessKeyId: accessKeys.accessKeyId,
      secretAccessKey: accessKeys.secretAccessKey,
      sessionToken: accessKeys.sessionToken,
    });

    const queryParams: URLSearchParams = new URLSearchParams({
      Action: 'AssumeRole',
      RoleArn: roleArn,
      RoleSessionName: sessionName,
      // The actual maximum duration depends on the target role's configured MaxSessionDuration value.
      // Note: This limit applies only when an IAM user or long-term credentials assume a role. Role-to-role chaining remains restricted to a maximum of 1 hour regardless of this setting.
      DurationSeconds: '43200',
      Version: '2011-06-15',
    });

    const url = `https://sts.${region}.amazonaws.com/?${queryParams.toString()}`;

    const response: Response = await stsClient.fetch(url, { method: 'POST' });
    const xmlText: string = await response.text();

    if (!response.ok) {
      console.error(`AssumeRole failed: ${response.status} ${response.statusText}\n${xmlText}`);
      throw new UnauthorizedError('Failed to get response from STS AssumeRole.');
    }

    const accessKeyIdMatch = xmlText.match(/<AccessKeyId>([^<]+)<\/AccessKeyId>/);
    const secretAccessKeyMatch = xmlText.match(/<SecretAccessKey>([^<]+)<\/SecretAccessKey>/);
    const sessionTokenMatch = xmlText.match(/<SessionToken>([^<]+)<\/SessionToken>/);
    const expirationMatch = xmlText.match(/<Expiration>([^<]+)<\/Expiration>/);

    if (!accessKeyIdMatch || !secretAccessKeyMatch || !sessionTokenMatch || !expirationMatch) {
      throw new InternalServerError('Unable to parse temporary credentials from STS AssumeRole response.');
    }

    return {
      accessKeyId: accessKeyIdMatch[1],
      secretAccessKey: secretAccessKeyMatch[1],
      sessionToken: sessionTokenMatch[1],
      expiration: expirationMatch[1],
    };
  }
}

export { AssumeRoleUtil };
