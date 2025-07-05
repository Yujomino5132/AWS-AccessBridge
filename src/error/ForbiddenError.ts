import { ErrorCode, IServiceError } from './IServiceError';

class ForbiddenError extends IServiceError {
  public getErrorCode(): ErrorCode {
    return 403;
  }

  public getErrorType(): string {
    return 'Forbidden';
  }

  public getErrorMessage(): string {
    return this.message;
  }
}

export { ForbiddenError };
