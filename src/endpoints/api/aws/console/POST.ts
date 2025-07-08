import { AwsConsoleUtil } from '../../../../utils';
import { ActivityContext, IActivityAPIRoute, IEnv, IRequest, IResponse } from '../../../IActivityAPIRoute';

class GenerateConsoleUrlRoute extends IActivityAPIRoute<GenerateConsoleUrlRequest, GenerateConsoleUrlResponse, GenerateConsoleUrlEnv> {
  schema = {
    tags: ['AWS'],
  };

  protected async handleRequest(
    request: GenerateConsoleUrlRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    env: IEnv,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cxt: ActivityContext<IEnv>,
  ): Promise<GenerateConsoleUrlResponse> {
    const signinToken: string = await AwsConsoleUtil.getSigninToken(request.accessKeyId, request.secretAccessKey, request.sessionToken);
    const loginUrl: string = AwsConsoleUtil.getLoginUrl(signinToken);

    return {
      url: loginUrl,
    };
  }
}

interface GenerateConsoleUrlRequest extends IRequest {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string | undefined;
}

interface GenerateConsoleUrlResponse extends IResponse {
  url: string;
}

type GenerateConsoleUrlEnv = IEnv;

export { GenerateConsoleUrlRoute };
