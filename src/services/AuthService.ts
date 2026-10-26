import api from './api'
import type { AuthResponse, LoginPayload, RegisterPayload, UsernameAvailability } from '@/types'

/**
 * Login can sign in straight away (200) or ask for the emailed 6-digit code (202). Blocked
 * (403) and locked-out (429) answers arrive as errors; see LoginView.
 */
export type LoginResult = { kind: 'session'; auth: AuthResponse } | { kind: 'otp'; challengeId: string }

type LoginBody = AuthResponse | { otpRequired: true; challengeId: string }

function toLoginResult(status: number, body: LoginBody): LoginResult {
  if (status === 202 || ('otpRequired' in body && body.otpRequired)) {
    return { kind: 'otp', challengeId: (body as { challengeId: string }).challengeId }
  }
  return { kind: 'session', auth: body as AuthResponse }
}

/** Sign-up sends a confirmation email; there's no session until the email is verified. */
/** verificationRequired is false when the server confirmed the email straight away (no email is sent). */
export async function register(payload: RegisterPayload): Promise<{ email: string; verificationRequired?: boolean }> {
  const response = await api.post<{ email: string; verificationRequired?: boolean }>('/auth/register', payload)
  return response.data
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const response = await api.post<LoginBody>('/auth/login', payload)
  return toLoginResult(response.status, response.data)
}

/** Second sign-in step: the 6-digit code from the email. */
export async function loginOtp(challengeId: string, code: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login/otp', { challengeId, code })
  return response.data
}

export type GoogleResult = LoginResult | { kind: 'needsProfile'; email: string | null }

/** Google credential → session, OTP step, or "new account: ask for age and the ticks". */
export async function google(payload: {
  idToken: string
  dateOfBirth?: string
  acceptTerms?: boolean
  acceptRules?: boolean
}): Promise<GoogleResult> {
  const response = await api.post<LoginBody | { needsProfile: true; email?: string }>('/auth/google', payload)
  const body = response.data
  if ('needsProfile' in body && body.needsProfile) return { kind: 'needsProfile', email: body.email ?? null }
  return toLoginResult(response.status, body as LoginBody)
}

export type VerifyEmailStatus = 'verified' | 'alreadyVerified' | 'expired' | 'used' | 'invalid'

/** "Verify email": posts the token from the emailed link. The 400 answers carry a status too. */
export async function verifyEmail(token: string): Promise<VerifyEmailStatus> {
  const response = await api.post<{ status?: VerifyEmailStatus }>(
    '/auth/verify-email',
    { token },
    { validateStatus: (s) => s === 200 || s === 400 },
  )
  return response.data?.status ?? 'invalid'
}

export async function resendVerification(): Promise<void> {
  await api.post('/auth/resend-verification')
}

/** Signed-out resend (login screen, check-your-email screen). Always answers 200. */
export async function resendVerificationByEmail(email: string): Promise<void> {
  await api.post('/auth/resend-verification-email', { email })
}

/** "Forgot password": emails a one-hour reset link. Always answers 200. */
export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email })
}

export type ResetPasswordStatus = 'reset' | 'expired' | 'used' | 'invalid'

/** Sets the new password from the reset link's token. Password problems throw (400 with field). */
export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordStatus> {
  const response = await api.post<{ status?: ResetPasswordStatus }>('/auth/reset-password', { token, newPassword })
  return response.data?.status ?? 'reset'
}

export async function checkUsername(username: string): Promise<UsernameAvailability> {
  const response = await api.get<UsernameAvailability>('/auth/check-username', { params: { username } })
  return response.data
}

/** Quick-access link (/play/:token): signs the linked player in without a password. */
export async function linkLogin(token: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/link', { token })
  return response.data
}
