import axios, { AxiosResponse } from 'axios';

class AwsConsoleUtil {
  public static async getSigninToken(accessKeyId: string, secretAccessKey: string, sessionToken?: string | undefined): Promise<string> {
    const session: SessionCredentials = {
      sessionId: accessKeyId,
      sessionKey: secretAccessKey,
      sessionToken: sessionToken,
    };
    const sessionJson: string = JSON.stringify(session);
    const sessionEncoded: string = encodeURIComponent(sessionJson);

    const url: string = `https://signin.aws.amazon.com/federation?Action=getSigninToken&SessionType=json&Session=${sessionEncoded}`;
    const response: AxiosResponse = await axios.get(url);

    return response.data.SigninToken;
  }

  public static getLoginUrl(signinToken: string, destination = 'https://console.aws.amazon.com/'): string {
    const params: URLSearchParams = new URLSearchParams({
      Action: 'login',
      Issuer: 'example.com',
      Destination: destination,
      SigninToken: signinToken,
    });

    return `https://signin.aws.amazon.com/federation?${params.toString()}`;
  }
}

interface SessionCredentials {
  sessionId: string;
  sessionKey: string;
  sessionToken?: string | undefined;
}

export { AwsConsoleUtil };
