import { Request, Response } from 'express';
import { prisma } from '../../../shared/providers/prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import { getClinicaId } from '../../../shared/middlewares/auth.js';

function normalizeText(str: string): string {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const search = (req.query.search || req.query.busca || req.query.q) as string | undefined;

  const pageNum = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const requestedLimit = req.query.limit
    ? parseInt(req.query.limit as string, 10)
    : (req.query.page ? 20 : 100);
  const limitNum = Math.min(Math.max(1, requestedLimit || 20), 100);

  let convenios = await prisma.convenio.findMany({
    where: { clinicaId },
    orderBy: { nome: 'asc' },
  });

  if (search && search.trim()) {
    const term = normalizeText(search.trim());
    convenios = convenios.filter((c) =>
      normalizeText(c.nome).includes(term) ||
      (c.registroANS && normalizeText(c.registroANS).includes(term))
    );
  }

  const total = convenios.length;
  const skip = (pageNum - 1) * limitNum;
  const paginatedConvenios = convenios.slice(skip, skip + limitNum);

  return res.json({
    success: true,
    data: paginatedConvenios,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
}

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const convenio = await prisma.convenio.create({
    data: { ...req.body, clinicaId },
  });
  return res.status(201).json({ success: true, data: convenio });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const existente = await prisma.convenio.findFirst({ where: { id, clinicaId } });
  if (!existente) throw new AppError('Convênio não encontrado', 404);

  const convenio = await prisma.convenio.update({ where: { id }, data: req.body });
  return res.json({ success: true, data: convenio });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const existente = await prisma.convenio.findFirst({ where: { id, clinicaId } });
  if (!existente) throw new AppError('Convênio não encontrado', 404);

  await prisma.convenio.delete({ where: { id } });
  return res.json({ success: true, message: 'Convênio excluído' });
}
