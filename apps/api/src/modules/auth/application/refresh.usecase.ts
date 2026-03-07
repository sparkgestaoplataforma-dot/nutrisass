import jwt from 'jsonwebtoken';
import { redis } from '../../../shared/providers/redis.js';
import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import type { TokenPayload, AuthTokens } from '@nutricao/shared';

export async function refreshUseCase(refreshToken: string): Promise<AuthTokens> {
  let decoded: TokenPayload;

  try {
    decoded = jwt.verify(refreshToken, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new AppError('Refresh token inválido', 401);
  }

  const storedToken = await redis.get(`refresh:${decoded.userId}`);

  if (!storedToken || storedToken !== refreshToken) {
    throw new AppError('Refresh token inválido ou expirado', 401);
  }

  const payload: TokenPayload = {
    userId: decoded.userId,
    email: decoded.email,
    perfil: decoded.perfil,
  };

  const newAccessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const newRefreshToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  await redis.set(
    `refresh:${decoded.userId}`,
    newRefreshToken,
    'EX',
    7 * 24 * 60 * 60,
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
