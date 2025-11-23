import axios, { AxiosError } from 'axios';
import { UnauthorizedError } from '../error';

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

    try {
      return (await axios.get<SigninResponse>(url)).data.SigninToken;
    } catch (error: unknown) {
      console.error('Caught exception while getting signin token from AWS', error);
      if (axios.isAxiosError(error)) {
        const axiosError: AxiosError = error as AxiosError;
        const status: number | undefined = axiosError.response?.status;
        if (status === 400) {
          throw new UnauthorizedError('AWS access credentials are not valid.');
        }
      }
      throw error;
    }
  }

  public static getLoginUrl(signinToken: string, issuer: string, destination = 'https://console.aws.amazon.com/'): string {
    const params: URLSearchParams = new URLSearchParams({
      Action: 'login',
      Issuer: issuer,
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

interface SigninResponse {
  SigninToken: string;
  Expiration: string;
}

export { AwsConsoleUtil };
