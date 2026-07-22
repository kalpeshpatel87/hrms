import { createHash, randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { recordAuditLog } from '../../lib/auditLog.js';
import { ApiError } from '../../lib/ApiError.js';
import {
  signAccessToken,
  signPasswordResetToken,
  signRefreshToken,
  verifyPasswordResetToken,
  verifyRefreshToken,
  type AccessTokenPayload,
} from '../../lib/jwt.js';
import { logger } from '../../lib/logger.js';

const BCRYPT_ROUNDS = 12;

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

async function loadEffectivePermissions(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });

  const roles = userRoles.map((ur) => ur.role.slug);
  const permissionSet = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.rolePermissions) {
      permissionSet.add(rp.permission.key);
    }
  }
  return { roles, permissions: Array.from(permissionSet) };
}

async function buildAccessTokenPayload(userId: string, email: string, tokenVersion: number): Promise<AccessTokenPayload> {
  const { roles, permissions } = await loadEffectivePermissions(userId);
  return { sub: userId, email, tokenVersion, roles, permissions };
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: { id: string; email: string; mustChangePassword: boolean; roles: string[]; permissions: string[] };
}

export async function login(
  email: string,
  password: string,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { roles, permissions } = await loadEffectivePermissions(user.id);
  const accessToken = signAccessToken({ sub: user.id, email: user.email, tokenVersion: user.tokenVersion, roles, permissions });

  const family = randomUUID();
  const refreshExpiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRY));
  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: '', // filled in after we know the JWT (jti = record id)
      family,
      expiresAt: refreshExpiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });

  const refreshToken = signRefreshToken({ sub: user.id, jti: refreshTokenRecord.id, family });
  await prisma.refreshToken.update({
    where: { id: refreshTokenRecord.id },
    data: { tokenHash: hashToken(refreshToken) },
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenId: refreshTokenRecord.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: refreshExpiresAt,
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastLoginIp: meta.ipAddress } });
  await recordAuditLog({ action: 'LOGIN', entityType: 'User', entityId: user.id });

  return {
    accessToken,
    refreshToken,
    refreshExpiresAt,
    user: { id: user.id, email: user.email, mustChangePassword: user.mustChangePassword, roles, permissions },
  };
}

export async function refresh(
  rawRefreshToken: string,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<Omit<AuthResult, 'user'>> {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const existing = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!existing) throw ApiError.unauthorized('Refresh token not recognized');

  if (existing.revokedAt || existing.expiresAt < new Date()) {
    // Token reuse after revocation/expiry is a strong signal of theft — burn the whole family.
    await prisma.refreshToken.updateMany({
      where: { family: existing.family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    logger.warn({ userId: existing.userId, family: existing.family }, 'Refresh token reuse detected — family revoked');
    throw ApiError.unauthorized('Session invalidated — please sign in again');
  }

  if (hashToken(rawRefreshToken) !== existing.tokenHash) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user || !user.isActive) throw ApiError.unauthorized('Account is inactive or no longer exists');

  const refreshExpiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRY));
  const rotated = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: '',
      family: existing.family,
      expiresAt: refreshExpiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });
  const newRefreshToken = signRefreshToken({ sub: user.id, jti: rotated.id, family: existing.family });
  await prisma.refreshToken.update({ where: { id: rotated.id }, data: { tokenHash: hashToken(newRefreshToken) } });
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedByTokenId: rotated.id },
  });

  const accessTokenPayload = await buildAccessTokenPayload(user.id, user.email, user.tokenVersion);
  const accessToken = signAccessToken(accessTokenPayload);

  return { accessToken, refreshToken: newRefreshToken, refreshExpiresAt };
}

export async function logout(rawRefreshToken: string | undefined): Promise<void> {
  if (!rawRefreshToken) return;
  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await recordAuditLog({ action: 'LOGOUT', entityType: 'User', entityId: payload.sub });
  } catch {
    // Already invalid/expired — nothing to revoke, logout is idempotent either way.
  }
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: { include: { department: true, designation: true, branch: true } } },
  });
  if (!user) throw ApiError.notFound('User not found');

  const { roles, permissions } = await loadEffectivePermissions(userId);
  return {
    id: user.id,
    email: user.email,
    mustChangePassword: user.mustChangePassword,
    mfaEnabled: user.mfaEnabled,
    roles,
    permissions,
    employee: user.employee,
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw ApiError.badRequest('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false, tokenVersion: { increment: 1 } },
  });

  // Bumping tokenVersion above invalidates every other outstanding access token; also
  // revoke all refresh tokens so no other device can silently mint a new session.
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  await recordAuditLog({ action: 'CHANGE_PASSWORD', entityType: 'User', entityId: userId });
}

/**
 * Password reset uses a short-lived signed JWT rather than a dedicated DB
 * table — it embeds the user's current tokenVersion, so it's automatically
 * invalidated the moment the password changes (or any other reset happens).
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Don't reveal whether the email exists.

  const resetToken = signPasswordResetToken({ sub: user.id, tokenVersion: user.tokenVersion });

  // SMTP isn't configured by default in this pass — log the link so the flow
  // is testable end-to-end locally; wire a real mailer in src/lib/mailer.ts later.
  logger.info({ email }, `Password reset requested. Link: ${env.WEB_APP_URL}/reset-password?token=${resetToken}`);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  let payload;
  try {
    payload = verifyPasswordResetToken(token);
  } catch {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.badRequest('This reset link has expired or already been used');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false, tokenVersion: { increment: 1 } },
  });
  await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await recordAuditLog({ action: 'RESET_PASSWORD', entityType: 'User', entityId: user.id });
}

function parseDurationMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // fallback: 30 days
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as 's' | 'm' | 'h' | 'd'];
  return value * multiplier;
}
