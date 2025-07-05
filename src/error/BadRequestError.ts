import { ErrorCode, IServiceError } from './IServiceError';

class BadRequestError extends IServiceError {
  public getErrorCode(): ErrorCode {
    return 400;
  }

  public getErrorType(): string {
    return 'BadRequest';
  }

  public getErrorMessage(): string {
    return this.message;
  }
}

export { BadRequestError };
