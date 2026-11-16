import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/shared/providers/prisma';
import { env } from '@/config/env';
import { AppError } from '@/shared/middlewares/errorHandler';
import { redisSet } from '@/shared/providers/redis';
import type { TokenPayload, AuthTokens } from '@nutricao/shared';

export async function realizarOnboardingClinica(dados: {
  tipo?: 'CLINICA' | 'AUTONOMO';
  clinica: Record<string, any>;
  admin: Record<string, any>;
}) {
  const { tipo = 'CLINICA', clinica, admin } = dados;

  const emailExistente = await prisma.usuario.findUnique({
    where: { email: admin.email },
  });
  if (emailExistente) throw new AppError('E-mail já cadastrado', 409);

  if (clinica.cnpj) {
    const cnpjExistente = await prisma.clinica.findUnique({
      where: { cnpj: clinica.cnpj },
    });
    if (cnpjExistente) throw new AppError('CNPJ já cadastrado', 409);
  }

  const senhaHash = await bcrypt.hash(admin.senha, 10);

  const result = await prisma.$transaction(async (tx) => {
    const novaClinica = await tx.clinica.create({
      data: {
        nome: clinica.nome,
        cnpj: clinica.cnpj || null,
        telefone: clinica.telefone || null,
        email: clinica.email || null,
        endereco: clinica.endereco || null,
        tipo,
      },
    });

    const novoAdmin = await tx.usuario.create({
      data: {
        clinicaId: novaClinica.id,
        nome: admin.nome,
        email: admin.email,
        senha: senhaHash,
        perfil: tipo === 'AUTONOMO' ? 'NUTRICIONISTA' : 'ADMIN',
      },
    });

    await tx.convenio.create({
      data: {
        clinicaId: novaClinica.id,
        nome: 'Particular',
      },
    });

    return { clinica: novaClinica, admin: novoAdmin };
  });

  const payload: TokenPayload = {
    userId: result.admin.id,
    clinicaId: result.clinica.id,
    email: result.admin.email,
    perfil: result.admin.perfil,
    tipoClinica: result.clinica.tipo,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  return {
    clinica: result.clinica,
    tokens: { accessToken, refreshToken } as AuthTokens,
  };
}

export async function obterClinicaPorId(clinicaId: string) {
  return prisma.clinica.findUnique({
    where: { id: clinicaId },
  });
}

export async function atualizarDadosClinica(clinicaId: string, dados: Record<string, any>) {
  return prisma.clinica.update({
    where: { id: clinicaId },
    data: dados as any,
  });
}

export async function alterarModoClinica(params: {
  clinicaId: string;
  userId: string;
  email: string;
  tipo: 'AUTONOMO' | 'CLINICA';
}) {
  const { clinicaId, userId, email, tipo } = params;

  const clinica = await prisma.clinica.findUnique({ where: { id: clinicaId } });
  if (!clinica) throw new AppError('Clínica não encontrada', 404);

  if (clinica.tipo === tipo) {
    throw new AppError(`A clínica já está no modo ${tipo}`, 400);
  }

  if (tipo === 'AUTONOMO') {
    const totalUsuarios = await prisma.usuario.count({ where: { clinicaId } });
    if (totalUsuarios > 1) {
      throw new AppError(
        'Para migrar para o modo Autônomo, a clínica deve ter apenas 1 usuário. Remova os demais primeiro.',
        400,
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.clinica.update({
      where: { id: clinicaId },
      data: { tipo },
    });

    const novoPerfil = tipo === 'AUTONOMO' ? 'NUTRICIONISTA' : 'ADMIN';
    await tx.usuario.update({
      where: { id: userId },
      data: { perfil: novoPerfil },
    });

    return { tipo, perfil: novoPerfil };
  });

  const payload: TokenPayload = {
    userId,
    clinicaId,
    email,
    perfil: result.perfil,
    tipoClinica: result.tipo,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  await redisSet(`refresh:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  return {
    tipo: result.tipo,
    perfil: result.perfil,
    tokens: { accessToken, refreshToken },
  };
}

