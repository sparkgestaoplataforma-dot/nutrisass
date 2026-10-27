import bcrypt from "bcryptjs";
import { prisma } from "../../../shared/providers/prisma.js";
import { AppError } from "../../../shared/middlewares/errorHandler.js";

export async function pegarUsuarios(clinicaId: string) {
  const usuarios = await prisma.usuario.findMany({
    where: { clinicaId },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      criadoEm: true,
    },
    orderBy: { nome: "asc" },
  });
  return usuarios;
}

export async function pegarTodosNutricionistas(clinicaId: string) {
  const nutricionistas = await prisma.usuario.findMany({
    where: {
      clinicaId,
      perfil: { in: ["NUTRICIONISTA", "ADMIN"] },
    },
    select: {
      id: true,
      nome: true,
      perfil: true
    },
    orderBy: { nome: "asc" }
  });

  return nutricionistas;
}

export async function criarUsuario(clinicaId: string, data: any) {
  const clinica = await prisma.clinica.findUnique({
    where: { id: clinicaId },
    select: { tipo: true },
  });

  if (clinica?.tipo === 'AUTONOMO') {
    throw new AppError(
      "Não é possível adicionar novos usuários no modo Autônomo. Migre para o modo Clínica primeiro.",
      400
    );
  }

  const existente = await prisma.usuario.findUnique({
    where: { email: data.email },
  });
  if (existente) throw new AppError("E-mail já cadastrado", 409);

  const senhaHash = await bcrypt.hash(data.senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      clinicaId,
      nome: data.nome,
      email: data.email,
      senha: senhaHash,
      perfil: data.perfil,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      criadoEm: true,
    },
  });

  return usuario;
}

export async function editarUsuario(id: string, clinicaId: string, body: any) {
  const existente = await prisma.usuario.findFirst({
    where: { id, clinicaId },
  });
  if (!existente) throw new AppError("Usuário não encontrado", 404);

  const data: any = {
    nome: body.nome,
    email: body.email,
    perfil: body.perfil,
  };

  if (body.senha) {
    data.senha = await bcrypt.hash(body.senha, 10);
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      criadoEm: true,
    },
  });

  return usuario;
}

export async function excluirUsuario(id: string, clinicaId: string) {
  const existente = await prisma.usuario.findFirst({
    where: { id, clinicaId },
  });
  if (!existente) throw new AppError("Usuário não encontrado", 404);

  const totalUsuarios = await prisma.usuario.count({
    where: { clinicaId },
  });
  if (totalUsuarios <= 1) {
    throw new AppError("Não é possível excluir o único usuário do consultório/clínica.", 400);
  }

  if (existente.perfil === "ADMIN") {
    const totalAdmins = await prisma.usuario.count({
      where: { clinicaId, perfil: "ADMIN" },
    });
    if (totalAdmins <= 1) {
      throw new AppError("Não é possível excluir o último administrador", 400);
    }
  }

  await prisma.usuario.delete({ where: { id } });
  return { message: "Usuário excluído" };
}

export async function esqueciSenha(email: string) {
  const existente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!existente) throw new AppError("Email não encontrado", 404);

  return { email, found: !!existente };
}

export async function alterarSenha(email: string, novaSenha: string) {
  const senhaHash = await bcrypt.hash(novaSenha, 10);
  const atualizarSenha = await prisma.usuario.update({
    where: { email },
    data: { senha: senhaHash },
  });

  return { email, senhaAtualizada: !!atualizarSenha };
}
