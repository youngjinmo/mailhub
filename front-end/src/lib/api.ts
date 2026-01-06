// API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * API Response wrapper interface
 */
interface ApiResponse<T> {
  result: 'success' | 'fail';
  data: T;
}

/**
 * In-memory access token storage
 * This will be cleared when the tab is closed or page is refreshed
 */
let accessToken: string | null = null;

/**
 * Set the access token in memory
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Get the current access token from memory
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Decode JWT token to get payload
 */
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Get username from access token
 */
export function getUsernameFromToken(): string | null {
  if (!accessToken) return null;
  const payload = decodeJWT(accessToken);
  return payload?.username || null;
}

/**
 * Clear the access token from memory
 */
export function clearAccessToken(): void {
  accessToken = null;
}

/**
 * Refresh the access token using the refresh token from HTTP-only cookie
 * @returns New access token
 */
export async function refreshToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // Include HTTP-only cookies
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const apiResponse: ApiResponse<string> = await response.json();

  if (!response.ok || apiResponse.result === 'fail') {
    throw new Error(
      typeof apiResponse.data === 'string'
        ? apiResponse.data
        : 'Failed to refresh token'
    );
  }

  const newAccessToken = apiResponse.data;
  setAccessToken(newAccessToken);
  return newAccessToken;
}

/**
 * Make an authenticated API request with automatic token refresh
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Add authorization header if access token exists
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include HTTP-only cookies
  });

  // If unauthorized and we haven't tried to refresh yet, try refreshing the token
  if (response.status === 401) {
    try {
      await refreshToken();

      // Retry the request with the new token
      headers.set('Authorization', `Bearer ${accessToken}`);
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (error) {
      // Refresh failed, clear token and propagate error
      clearAccessToken();
      throw error;
    }
  }

  return response;
}

/**
 * Send verification code to the user's email
 * @param email - User's email address
 */
export async function sendVerificationCode(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/send-verification-code?username=${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const apiResponse: ApiResponse<void> = await response.json();

  if (!response.ok || apiResponse.result === 'fail') {
    throw new Error(
      typeof apiResponse.data === 'string'
        ? apiResponse.data
        : 'Failed to send verification code'
    );
  }
}

/**
 * Login with verification code
 * @param email - User's email address
 * @param code - Verification code
 * @returns Access token
 */
export async function login(email: string, code: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login?username=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
    method: 'POST',
    credentials: 'include', // Include cookies for refresh token
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const apiResponse: ApiResponse<string> = await response.json();

  if (!response.ok || apiResponse.result === 'fail') {
    throw new Error(
      typeof apiResponse.data === 'string'
        ? apiResponse.data
        : 'Failed to login'
    );
  }

  // Store access token in memory
  const token = apiResponse.data;
  setAccessToken(token);
  return token;
}

/**
 * Logout and clear tokens
 */
export async function logout(): Promise<void> {
  // Call backend logout endpoint to remove refresh token from Redis and cookie
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Include access token in Authorization header for authentication
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });
  } catch (error) {
    // Ignore errors during logout
    console.error('Logout error:', error);
  } finally {
    // Always clear access token from memory
    clearAccessToken();
  }
}

/**
 * Check if user is authenticated
 * Tries to refresh token if access token is not available
 */
export async function checkAuth(): Promise<boolean> {
  if (accessToken) {
    return true;
  }

  try {
    await refreshToken();
    return true;
  } catch {
    return false;
  }
}
