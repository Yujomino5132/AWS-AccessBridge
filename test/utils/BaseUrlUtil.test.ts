import { describe, it, expect } from 'vitest';
import { BaseUrlUtil } from '@/utils/BaseUrlUtil';
import { InternalServerError } from '@/error';
import { INTERNAL_BASE_URL_HEADER, SELF_WORKER_BASE_HOSTNAME } from '@/constants';

describe('BaseUrlUtil', () => {
  describe('getBaseUrl', () => {
    it('returns origin for external requests', () => {
      const request = new Request('https://my-worker.example.com/api/test');
      expect(BaseUrlUtil.getBaseUrl(request)).toBe('https://my-worker.example.com');
    });

    it('returns origin for external requests with port', () => {
      const request = new Request('https://localhost:8787/api/test');
      expect(BaseUrlUtil.getBaseUrl(request)).toBe('https://localhost:8787');
    });

    it('returns internal base URL header for self-worker requests', () => {
      const request = new Request(`https://${SELF_WORKER_BASE_HOSTNAME}/api/test`, {
        headers: { [INTERNAL_BASE_URL_HEADER]: 'https://real-origin.example.com' },
      });
      expect(BaseUrlUtil.getBaseUrl(request)).toBe('https://real-origin.example.com');
    });

    it('throws InternalServerError when self-worker request missing base URL header', () => {
      const request = new Request(`https://${SELF_WORKER_BASE_HOSTNAME}/api/test`);
      expect(() => BaseUrlUtil.getBaseUrl(request)).toThrow(InternalServerError);
      expect(() => BaseUrlUtil.getBaseUrl(request)).toThrow('Internal call missing required base URL header.');
    });
  });
});
