import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../shared/providers/prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';

export async function listar(_req: Request, res: Response) {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      criadoEm: true,
    },
    orderBy: { nome: 'asc' },
  });
  return res.json({ success: true, data: usuarios });
}

export async function criar(req: Request, res: Response) {
  const existente = await prisma.usuario.findUnique({
    where: { email: req.body.email },
  });
  if (existente) throw new AppError('E-mail já cadastrado', 409);

  const senhaHash = await bcrypt.hash(req.body.senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome: req.body.nome,
      email: req.body.email,
      senha: senhaHash,
      perfil: req.body.perfil,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      criadoEm: true,
    },
  });

  return res.status(201).json({ success: true, data: usuario });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) throw new AppError('Usuário não encontrado', 404);

  const data: any = {
    nome: req.body.nome,
    email: req.body.email,
    perfil: req.body.perfil,
  };

  if (req.body.senha) {
    data.senha = await bcrypt.hash(req.body.senha, 10);
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

  return res.json({ success: true, data: usuario });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) throw new AppError('Usuário não encontrado', 404);

  if (existente.perfil === 'ADMIN') {
    const totalAdmins = await prisma.usuario.count({
      where: { perfil: 'ADMIN' },
    });
    if (totalAdmins <= 1) {
      throw new AppError('Não é possível excluir o último administrador', 400);
    }
  }

  await prisma.usuario.delete({ where: { id } });
  return res.json({ success: true, message: 'Usuário excluído' });
}
