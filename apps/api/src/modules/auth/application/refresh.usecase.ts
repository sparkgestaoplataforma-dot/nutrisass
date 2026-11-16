import jwt from 'jsonwebtoken';
import { redisGet, redisSet } from "@/shared/providers/redis";
import { env } from "@/config/env";
import { AppError } from "@/shared/middlewares/errorHandler";
import { prisma } from "@/shared/providers/prisma";
import type { TokenPayload, AuthTokens } from '@nutricao/shared';

export async function refreshUseCase(refreshToken: string): Promise<AuthTokens> {
  let decoded: TokenPayload;

  try {
    decoded = jwt.verify(refreshToken, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new AppError('Refresh token inválido', 401);
  }

  const storedToken = await redisGet(`refresh:${decoded.userId}`);

  if (storedToken && storedToken !== refreshToken) {
    throw new AppError('Refresh token inválido ou expirado', 401);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: decoded.userId },
    include: { clinica: { select: { tipo: true } } },
  });

  if (!usuario) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const payload: TokenPayload = {
    userId: usuario.id,
    clinicaId: usuario.clinicaId,
    email: usuario.email,
    perfil: usuario.perfil,
    tipoClinica: usuario.clinica.tipo,
  };

  const newAccessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const newRefreshToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  await redisSet(
    `refresh:${decoded.userId}`,
    newRefreshToken,
    'EX',
    7 * 24 * 60 * 60,
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
