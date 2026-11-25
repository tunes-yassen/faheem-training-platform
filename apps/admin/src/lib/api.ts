const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const TOKEN_STORAGE_KEY = 'faheem_admin_token';

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  fromFallback?: boolean;
  status?: number;
  error?: string;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // ignore storage errors
  }
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Resilient API client that connects to the Faheem NestJS Backend when online
 * and gracefully falls back to the local interactive state when offline.
 */
export async function apiRequest<T>(
  path: string,
  options?: RequestInit & { tokenOverride?: string }
): Promise<ApiResult<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const token = options?.tokenOverride ?? getStoredToken();

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.message) {
          errMsg = Array.isArray(errBody.message)
            ? errBody.message.join('، ')
            : String(errBody.message);
        }
      } catch {
        // ignore json parse error
      }
      return { ok: false, status: res.status, fromFallback: true, error: errMsg };
    }

    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : (undefined as T);
    return { ok: true, status: res.status, data, fromFallback: false };
  } catch {
    return { ok: false, fromFallback: true, error: 'offline-demo-mode' };
  }
}

export async function requestAdminOtp(identifier: string) {
  return apiRequest<{
    message?: string;
    channel?: string;
    expiresInSeconds?: number;
    devOtp?: string;
  }>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  });
}

export async function verifyAdminOtp(identifier: string, code: string) {
  return apiRequest<{
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id: string;
      email?: string;
      phone?: string;
      role?: { code?: string; nameAr?: string };
      profile?: { fullNameAr?: string };
    };
  }>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ identifier, code }),
  });
}

export { API_BASE };
