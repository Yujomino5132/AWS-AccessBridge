import { describe, it, expect } from 'vitest';
import { EmailValidationUtil } from '@/utils/EmailValidationUtil';
import { InternalServerError, UnauthorizedError } from '@/error';
import { INTERNAL_USER_EMAIL_HEADER, SELF_WORKER_BASE_HOSTNAME } from '@/constants';

describe('EmailValidationUtil', () => {
  describe('getAuthenticatedUserEmail', () => {
    it('returns email from internal header for self-worker requests', async () => {
      const request = new Request(`https://${SELF_WORKER_BASE_HOSTNAME}/api/test`, {
        headers: { [INTERNAL_USER_EMAIL_HEADER]: 'internal@example.com' },
      });
      const email = await EmailValidationUtil.getAuthenticatedUserEmail(request);
      expect(email).toBe('internal@example.com');
    });

    it('throws InternalServerError for self-worker request without internal email header', async () => {
      const request = new Request(`https://${SELF_WORKER_BASE_HOSTNAME}/api/test`);
      await expect(EmailValidationUtil.getAuthenticatedUserEmail(request)).rejects.toThrow(InternalServerError);
      await expect(EmailValidationUtil.getAuthenticatedUserEmail(request)).rejects.toThrow(
        'Internal call missing required user email header.',
      );
    });

    it('returns email from Cf-Access-Authenticated-User-Email header', async () => {
      const request = new Request('https://worker.example.com/api/test', {
        headers: { 'Cf-Access-Authenticated-User-Email': 'user@example.com' },
      });
      const email = await EmailValidationUtil.getAuthenticatedUserEmail(request);
      expect(email).toBe('user@example.com');
    });

    it('throws UnauthorizedError when no email header or JWT token present', async () => {
      const request = new Request('https://worker.example.com/api/test');
      await expect(EmailValidationUtil.getAuthenticatedUserEmail(request)).rejects.toThrow(UnauthorizedError);
      await expect(EmailValidationUtil.getAuthenticatedUserEmail(request)).rejects.toThrow(
        'No authenticated user email or JWT token provided in request headers.',
      );
    });

    it('throws UnauthorizedError when JWT token present but missing config', async () => {
      const request = new Request('https://worker.example.com/api/test', {
        headers: { 'cf-access-jwt-assertion': 'some-jwt-token' },
      });
      await expect(EmailValidationUtil.getAuthenticatedUserEmail(request)).rejects.toThrow(UnauthorizedError);
      await expect(EmailValidationUtil.getAuthenticatedUserEmail(request)).rejects.toThrow(
        'Missing required JWT verification configuration.',
      );
    });

    it('throws UnauthorizedError when JWT token present but teamDomain missing', async () => {
      const request = new Request('https://worker.example.com/api/test', {
        headers: { 'cf-access-jwt-assertion': 'some-jwt-token' },
      });
      await expect(EmailValidationUtil.getAuthenticatedUserEmail(request, undefined, 'some-aud')).rejects.toThrow(UnauthorizedError);
    });
  });
});
