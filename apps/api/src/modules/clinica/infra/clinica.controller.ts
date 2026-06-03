import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/shared/providers/prisma.js";
import { env } from "@/config/env.js";
import { AppError } from "@/shared/middlewares/errorHandler.js";
import {
  getClinicaId,
  getUsuarioId,
} from "../../../shared/middlewares/auth.js";
import type { TokenPayload, AuthTokens } from "@nutricao/shared";
import { redisSet } from "@/shared/providers/redis.js";

export async function onboarding(req: Request, res: Response) {
  const { tipo = "CLINICA", clinica, admin } = req.body;

  const emailExistente = await prisma.usuario.findUnique({
    where: { email: admin.email },
  });
  if (emailExistente) throw new AppError("E-mail já cadastrado", 409);

  if (clinica.cnpj) {
    const cnpjExistente = await prisma.clinica.findUnique({
      where: { cnpj: clinica.cnpj },
    });
    if (cnpjExistente) throw new AppError("CNPJ já cadastrado", 409);
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
        tipo: tipo,
      },
    });

    const novoAdmin = await tx.usuario.create({
      data: {
        clinicaId: novaClinica.id,
        nome: admin.nome,
        email: admin.email,
        senha: senhaHash,
        perfil: tipo === "AUTONOMO" ? "NUTRICIONISTA" : "ADMIN",
      },
    });

    await tx.convenio.create({
      data: {
        clinicaId: novaClinica.id,
        nome: "Particular",
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

  return res.status(201).json({
    success: true,
    data: {
      clinica: result.clinica,
      tokens: { accessToken, refreshToken } as AuthTokens,
    },
  });
}

export async function getClinica(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);

  const clinica = await prisma.clinica.findUnique({
    where: { id: clinicaId },
  });

  return res.json({ success: true, data: clinica });
}

export async function atualizarClinica(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);

  const clinica = await prisma.clinica.update({
    where: { id: clinicaId },
    data: req.body,
  });

  return res.json({ success: true, data: clinica });
}

export async function alterarTipoClinica(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const userId = getUsuarioId(req);
  const { tipo } = req.body; // 'AUTONOMO' | 'CLINICA'

  const clinica = await prisma.clinica.findUnique({ where: { id: clinicaId } });
  if (!clinica) throw new AppError("Clínica não encontrada", 404);

  if (clinica.tipo === tipo) {
    throw new AppError(`A clínica já está no modo ${tipo}`, 400);
  }

  if (tipo === "AUTONOMO") {
    const totalUsuarios = await prisma.usuario.count({ where: { clinicaId } });
    if (totalUsuarios > 1) {
      throw new AppError(
        "Para migrar para o modo Autônomo, a clínica deve ter apenas 1 usuário. Remova os demais primeiro.",
        400,
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.clinica.update({
      where: { id: clinicaId },
      data: { tipo },
    });

    const novoPerfil = tipo === "AUTONOMO" ? "NUTRICIONISTA" : "ADMIN";
    await tx.usuario.update({
      where: { id: userId },
      data: { perfil: novoPerfil },
    });

    return { tipo, perfil: novoPerfil };
  });

  const payload: TokenPayload = {
    userId,
    clinicaId,
    email: req.user!.email,
    perfil: result.perfil,
    tipoClinica: result.tipo,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  await redisSet(
    `refresh:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60,
  );

  return res.json({
    success: true,
    data: {
      tipo: result.tipo,
      perfil: result.perfil,
      tokens: { accessToken, refreshToken },
    },
  });
}
