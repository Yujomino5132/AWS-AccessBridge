import {
  CF_CONNECTING_IP_HEADER,
  CF_RAY_HEADER,
  DEFAULT_API_INTERNAL_HOSTNAME,
  FORWARDED_FOR_HEADER,
  FORWARDED_HOST_HEADER,
  FORWARDED_PROTO_HEADER,
  FORWARDED_URI_HEADER,
} from '@/constants';

interface RequestOriginEnv {
  API_INTERNAL_HOST?: string | undefined;
}

class RequestOriginUtil {
  public static isPagesProxyRequest(request: Request, env?: unknown): boolean {
    const url: URL = new URL(request.url);
    const internalHostname: string = this.getApiInternalHostname(env);
    const cloudflareRequest: Request & { cf?: unknown } = request as Request & { cf?: unknown };
    return (
      url.hostname === internalHostname &&
      cloudflareRequest.cf !== undefined &&
      request.headers.has(CF_CONNECTING_IP_HEADER) &&
      request.headers.has(CF_RAY_HEADER)
    );
  }

  public static getTrustedForwardedOrigin(request: Request, env?: unknown): string | undefined {
    if (!this.isPagesProxyRequest(request, env)) {
      return undefined;
    }

    const forwardedHost: string | null = request.headers.get(FORWARDED_HOST_HEADER);
    const forwardedProto: string | null = request.headers.get(FORWARDED_PROTO_HEADER);
    if (!forwardedHost || !forwardedProto) {
      return undefined;
    }

    const normalizedProto: string = forwardedProto.toLowerCase();
    if (normalizedProto !== 'http' && normalizedProto !== 'https') {
      return undefined;
    }

    if (forwardedHost.includes('/') || forwardedHost.includes('\\')) {
      return undefined;
    }

    try {
      return new URL(`${normalizedProto}://${forwardedHost}`).origin;
    } catch {
      return undefined;
    }
  }

  public static getClientIpAddress(request: Request, env?: unknown): string | undefined {
    if (this.isPagesProxyRequest(request, env)) {
      const forwardedFor: string | null = request.headers.get(FORWARDED_FOR_HEADER);
      const clientIpAddress: string | undefined = forwardedFor
        ?.split(',')
        .map((ipAddress: string): string => ipAddress.trim())
        .find((ipAddress: string): boolean => ipAddress.length > 0);
      if (clientIpAddress) {
        return clientIpAddress;
      }
    }

    return request.headers.get(CF_CONNECTING_IP_HEADER) || undefined;
  }

  public static getForwardedUri(request: Request, env?: unknown): string | undefined {
    if (!this.isPagesProxyRequest(request, env)) {
      return undefined;
    }
    return request.headers.get(FORWARDED_URI_HEADER) || undefined;
  }

  private static getApiInternalHostname(env?: unknown): string {
    if (env && typeof env === 'object' && 'API_INTERNAL_HOST' in env) {
      const apiInternalHost: unknown = (env as RequestOriginEnv).API_INTERNAL_HOST;
      if (typeof apiInternalHost === 'string' && apiInternalHost.length > 0) {
        return apiInternalHost;
      }
    }
    return DEFAULT_API_INTERNAL_HOSTNAME;
  }
}

export { RequestOriginUtil };
export type { RequestOriginEnv };
