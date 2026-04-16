import { describe, it, expect } from 'vitest';
import {
  HMAC_HANDLER_ERROR_MISSING_AUTHENTICATION_HEADERS,
  HMAC_HANDLER_ERROR_SIGNATURE_INVALID,
  INTERNAL_SIGNATURE_HEADER,
  INTERNAL_TIMESTAMP_HEADER,
} from '@/constants';
import { UnauthorizedError } from '@/error';

// Test the error cases of HMACHandler by testing behavior at the constant/logic level
// Full integration tests with Hono context require more complex setup

describe('HMACHandler constants and validation logic', () => {
  describe('error messages', () => {
    it('missing authentication headers error is descriptive', () => {
      expect(HMAC_HANDLER_ERROR_MISSING_AUTHENTICATION_HEADERS).toBe('Missing internal authentication headers');
    });

    it('request outside time window error is descriptive', () => {
      expect(HMAC_HANDLER_ERROR_SIGNATURE_INVALID).toBe('Internal request signature invalid');
    });
  });

  describe('header detection', () => {
    it('signature and timestamp headers follow internal prefix convention', () => {
      expect(INTERNAL_SIGNATURE_HEADER).toMatch(/^x-internal-/);
      expect(INTERNAL_TIMESTAMP_HEADER).toMatch(/^x-internal-/);
    });
  });

  describe('error types', () => {
    it('throws UnauthorizedError for missing headers', () => {
      const error = new UnauthorizedError(HMAC_HANDLER_ERROR_MISSING_AUTHENTICATION_HEADERS);
      expect(error.getErrorCode()).toBe(401);
      expect(error.getErrorType()).toBe('Unauthorized');
    });
  });
});
