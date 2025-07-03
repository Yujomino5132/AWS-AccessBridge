import { AwsClient } from 'aws4fetch';

class AssumeRoleUtil {
  public static async assumeRole(
    accessKeyId: string,
    secretAccessKey: string,
    roleArn: string,
    sessionToken?: string,
    region: string = 'us-east-1',
  ): Promise<{
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken: string;
    Expiration: string;
  }> {
    const stsClient = new AwsClient({
      accessKeyId,
      secretAccessKey,
      sessionToken,
      service: 'sts',
      region,
    });

    const queryParams = new URLSearchParams({
      Action: 'AssumeRole',
      RoleArn: roleArn,
      RoleSessionName: 'aws4fetch-session',
      Version: '2011-06-15',
    });

    const url = `https://sts.${region}.amazonaws.com/?${queryParams.toString()}`;

    const response = await stsClient.fetch(url, { method: 'POST' });
    const xmlText = await response.text();

    if (!response.ok) {
      throw new Error(`AssumeRole failed: ${response.status} ${response.statusText}\n${xmlText}`);
    }

    // Extract credentials using regex (simplified)
    const accessKeyIdMatch = xmlText.match(/<AccessKeyId>([^<]+)<\/AccessKeyId>/);
    const secretAccessKeyMatch = xmlText.match(/<SecretAccessKey>([^<]+)<\/SecretAccessKey>/);
    const sessionTokenMatch = xmlText.match(/<SessionToken>([^<]+)<\/SessionToken>/);
    const expirationMatch = xmlText.match(/<Expiration>([^<]+)<\/Expiration>/);

    if (!accessKeyIdMatch || !secretAccessKeyMatch || !sessionTokenMatch || !expirationMatch) {
      throw new Error('Unable to parse temporary credentials from STS AssumeRole response.');
    }

    return {
      AccessKeyId: accessKeyIdMatch[1],
      SecretAccessKey: secretAccessKeyMatch[1],
      SessionToken: sessionTokenMatch[1],
      Expiration: expirationMatch[1],
    };
  }
}

export { AssumeRoleUtil };
