import type { Request, Response } from 'express';
import { isProduction } from '../../config/env.js';
import { issueCsrfCookie } from '../../middlewares/csrf.js';
import { ApiError } from '../../lib/ApiError.js';
import { sendSuccess } from '../../lib/response.js';
import * as authService from './auth.service.js';
import type { ChangePasswordInput, ForgotPasswordInput, LoginInput, ResetPasswordInput } from './auth.validation.js';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
}

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

export async function loginHandler(req: Request, res: Response) {
  const body = req.body as LoginInput;
  const result = await authService.login(body.email, body.password, requestMeta(req));
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  issueCsrfCookie(res);
  return sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Logged in successfully');
}

export async function refreshHandler(req: Request, res: Response) {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!rawRefreshToken) throw ApiError.unauthorized('No refresh token provided');

  const result = await authService.refresh(rawRefreshToken, requestMeta(req));
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  issueCsrfCookie(res);
  return sendSuccess(res, { accessToken: result.accessToken });
}

export async function logoutHandler(req: Request, res: Response) {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(rawRefreshToken);
  clearRefreshCookie(res);
  res.clearCookie('csrf_token', { path: '/' });
  return sendSuccess(res, null, 'Logged out successfully');
}

export async function meHandler(req: Request, res: Response) {
  const data = await authService.me(req.user!.sub);
  return sendSuccess(res, data);
}

export async function changePasswordHandler(req: Request, res: Response) {
  const body = req.body as ChangePasswordInput;
  await authService.changePassword(req.user!.sub, body.currentPassword, body.newPassword);
  return sendSuccess(res, null, 'Password changed successfully. Please sign in again.');
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const body = req.body as ForgotPasswordInput;
  await authService.forgotPassword(body.email);
  return sendSuccess(res, null, 'If an account exists for that email, a reset link has been sent.');
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const body = req.body as ResetPasswordInput;
  await authService.resetPassword(body.token, body.newPassword);
  return sendSuccess(res, null, 'Password has been reset. Please sign in with your new password.');
}
