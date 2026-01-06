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
 * Send verification code to the user's email
 * @param email - User's email address
 */
export async function sendVerificationCode(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/users/send-verification-code?username=${encodeURIComponent(email)}`, {
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
 * Verify the code entered by the user
 * @param email - User's email address
 * @param code - Verification code
 * @returns true if verification is successful, false otherwise
 */
export async function verifyCode(email: string, code: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/users/verify-code?username=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const apiResponse: ApiResponse<boolean> = await response.json();

  if (!response.ok || apiResponse.result === 'fail') {
    throw new Error(
      typeof apiResponse.data === 'string'
        ? apiResponse.data
        : 'Failed to verify code'
    );
  }

  return apiResponse.data;
}
