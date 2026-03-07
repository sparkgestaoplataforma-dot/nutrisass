import { Request, Response } from 'express';
import { prisma } from '../../../shared/providers/prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';

// Exames Base (config)
export async function listarExamesBase(_req: Request, res: Response) {
  const exames = await prisma.exameBase.findMany({
    orderBy: { nome: 'asc' },
  });
  return res.json({ success: true, data: exames });
}

export async function criarExameBase(req: Request, res: Response) {
  const existente = await prisma.exameBase.findUnique({
    where: { codigo: req.body.codigo },
  });
  if (existente) throw new AppError('Código de exame já existe', 409);

  const exame = await prisma.exameBase.create({ data: req.body });
  return res.status(201).json({ success: true, data: exame });
}

export async function editarExameBase(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const existente = await prisma.exameBase.findUnique({ where: { id } });
  if (!existente) throw new AppError('Exame não encontrado', 404);

  const exame = await prisma.exameBase.update({ where: { id }, data: req.body });
  return res.json({ success: true, data: exame });
}

export async function excluirExameBase(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const existente = await prisma.exameBase.findUnique({ where: { id } });
  if (!existente) throw new AppError('Exame não encontrado', 404);

  await prisma.exameBase.delete({ where: { id } });
  return res.json({ success: true, message: 'Exame excluído' });
}

// Solicitações de Exame (por paciente)
export async function listarSolicitacoes(req: Request<{ pacienteId: string }>, res: Response) {
  const { pacienteId } = req.params;

  const solicitacoes = await prisma.solicitacaoExame.findMany({
    where: { pacienteId },
    include: {
      itens: {
        include: { exameBase: true },
      },
    },
    orderBy: { dataSolicitada: 'desc' },
  });

  return res.json({ success: true, data: solicitacoes });
}

export async function solicitarExame(req: Request<{ pacienteId: string }>, res: Response) {
  const { pacienteId } = req.params;
  const { exameBaseIds } = req.body;

  const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
  if (!paciente) throw new AppError('Paciente não encontrado', 404);

  const solicitacao = await prisma.solicitacaoExame.create({
    data: {
      pacienteId,
      itens: {
        create: exameBaseIds.map((exameBaseId: string) => ({
          exameBaseId,
        })),
      },
    },
    include: {
      itens: { include: { exameBase: true } },
    },
  });

  return res.status(201).json({ success: true, data: solicitacao });
}

export async function registrarResultado(req: Request, res: Response) {
  const { itemId, dataResultado, resultado } = req.body;

  const item = await prisma.solicitacaoExameItem.findUnique({
    where: { id: itemId },
  });
  if (!item) throw new AppError('Item de solicitação não encontrado', 404);

  const updated = await prisma.solicitacaoExameItem.update({
    where: { id: itemId },
    data: {
      dataResultado: new Date(dataResultado),
      resultado,
    },
    include: { exameBase: true },
  });

  return res.json({ success: true, data: updated });
}

export async function excluirSolicitacao(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const existente = await prisma.solicitacaoExame.findUnique({ where: { id } });
  if (!existente) throw new AppError('Solicitação não encontrada', 404);

  await prisma.solicitacaoExame.delete({ where: { id } });
  return res.json({ success: true, message: 'Solicitação excluída' });
}
