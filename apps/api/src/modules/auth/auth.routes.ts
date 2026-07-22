import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { authLimiter } from '../../middlewares/rateLimit.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validate } from '../../middlewares/validate.js';
import { verifyCsrf } from '../../middlewares/csrf.js';
import * as controller from './auth.controller.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from './auth.validation.js';

export const authRoutes = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email + password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Access token + user profile; refresh token set as an httpOnly cookie
 */
authRoutes.post('/login', authLimiter, validate(loginSchema), asyncHandler(controller.loginHandler));

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Rotate the refresh token and issue a new access token
 *     tags: [Auth]
 */
authRoutes.post('/refresh', authLimiter, verifyCsrf, asyncHandler(controller.refreshHandler));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Revoke the current refresh token
 *     tags: [Auth]
 */
authRoutes.post('/logout', verifyCsrf, asyncHandler(controller.logoutHandler));

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Current authenticated user, roles, permissions, and employee profile
 *     tags: [Auth]
 */
authRoutes.get('/me', ...requireAuth(), asyncHandler(controller.meHandler));

// No CSRF check needed here: this route is authenticated via the explicit
// `Authorization: Bearer` header (see requireAuth -> authenticate), which a
// cross-site request cannot forge. CSRF only applies to routes relying on
// the browser auto-sending the httpOnly refresh cookie (refresh/logout above).
authRoutes.post(
  '/change-password',
  ...requireAuth(),
  validate(changePasswordSchema),
  asyncHandler(controller.changePasswordHandler),
);

authRoutes.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(controller.forgotPasswordHandler),
);

authRoutes.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(controller.resetPasswordHandler),
);
