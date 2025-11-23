import { jwtVerify, createRemoteJWKSet } from 'jose';
import { UnauthorizedError, InternalServerError } from '@/error';
import { INTERNAL_USER_EMAIL_HEADER, SELF_WORKER_BASE_HOSTNAME } from '@/constants';

class EmailValidationUtil {
  public static async getAuthenticatedUserEmail(request: Request, teamDomain?: string, policyAud?: string): Promise<string> {
    // Check if this is an internal call
    const url: URL = new URL(request.url);
    if (url.hostname === SELF_WORKER_BASE_HOSTNAME) {
      const internalEmail: string | null = request.headers.get(INTERNAL_USER_EMAIL_HEADER);
      if (internalEmail) {
        return internalEmail;
      }
      throw new InternalServerError('Internal call missing required user email header.');
    }

    // Try email header first
    const userEmail = request.headers.get('Cf-Access-Authenticated-User-Email');
    if (userEmail) {
      return userEmail;
    }

    // Fallback to JWT verification
    const token = request.headers.get('cf-access-jwt-assertion');
    if (!token) {
      throw new UnauthorizedError('No authenticated user email or JWT token provided in request headers.');
    }

    if (!teamDomain || !policyAud) {
      throw new UnauthorizedError('Missing required JWT verification configuration.');
    }

    try {
      const JWKS = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: teamDomain,
        audience: policyAud,
      });

      const email = payload.email as string;
      if (!email) {
        throw new UnauthorizedError('No email found in JWT token.');
      }
      return email;
    } catch (error) {
      throw new UnauthorizedError(`JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export { EmailValidationUtil };
