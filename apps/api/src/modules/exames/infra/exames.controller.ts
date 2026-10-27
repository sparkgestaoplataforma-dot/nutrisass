import { Request, Response } from 'express';
import { prisma } from '../../../shared/providers/prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import { getClinicaId } from '../../../shared/middlewares/auth.js';

function normalizeText(str: string): string {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Exames Base (config)
export async function listarExamesBase(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { tipo } = req.query; // 'base' | 'custom' | undefined (all)
  const search = (req.query.search || req.query.busca || req.query.q) as string | undefined;

  const where: any = { clinicaId };
  if (tipo === 'base') where.isBase = true;
  if (tipo === 'custom') where.isBase = false;

  const pageNum = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const requestedLimit = req.query.limit
    ? parseInt(req.query.limit as string, 10)
    : (req.query.page ? 20 : 100);
  const limitNum = Math.min(Math.max(1, requestedLimit || 20), 100);

  let exames = await prisma.exameBase.findMany({
    where,
    orderBy: { nome: 'asc' },
  });

  if (search && search.trim()) {
    const term = normalizeText(search.trim());
    exames = exames.filter((e) =>
      normalizeText(e.nome).includes(term) ||
      normalizeText(e.codigo).includes(term)
    );
  }

  const total = exames.length;
  const skip = (pageNum - 1) * limitNum;
  const paginatedExames = exames.slice(skip, skip + limitNum);

  return res.json({
    success: true,
    data: paginatedExames,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
}

export async function criarExameBase(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);

  const existente = await prisma.exameBase.findFirst({
    where: { clinicaId, codigo: req.body.codigo },
  });
  if (existente) throw new AppError('Código de exame já existe', 409);

  const exame = await prisma.exameBase.create({
    data: { ...req.body, clinicaId, isBase: false },
  });
  return res.status(201).json({ success: true, data: exame });
}

export async function editarExameBase(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const existente = await prisma.exameBase.findFirst({ where: { id, clinicaId } });
  if (!existente) throw new AppError('Exame não encontrado', 404);
  if (existente.isBase) throw new AppError('Exames base não podem ser editados', 403);

  const exame = await prisma.exameBase.update({ where: { id }, data: req.body });
  return res.json({ success: true, data: exame });
}

export async function excluirExameBase(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const existente = await prisma.exameBase.findFirst({ where: { id, clinicaId } });
  if (!existente) throw new AppError('Exame não encontrado', 404);
  if (existente.isBase) throw new AppError('Exames base não podem ser excluídos', 403);

  await prisma.exameBase.delete({ where: { id } });
  return res.json({ success: true, message: 'Exame exclu��do' });
}

// Solicitações de Exame (por paciente)
export async function listarSolicitacoes(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId } });
  if (!paciente) throw new AppError('Paciente não encontrado', 404);

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
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;
  const { exameBaseIds } = req.body;

  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId } });
  if (!paciente) throw new AppError('Paciente não encontrado', 404);

  const exameIds = [...new Set<string>(exameBaseIds)];
  const examesValidos = await prisma.exameBase.count({
    where: { id: { in: exameIds }, clinicaId },
  });
  if (examesValidos !== exameIds.length) throw new AppError('Exame inválido', 400);

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

// Lança exames externos (não solicitados pela clínica) já com resultado, em uma única operação
export async function lancarExameExterno(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;
  const { dataResultado, itens } = req.body as {
    dataResultado: string;
    itens: { exameBaseId: string; resultado: string }[];
  };

  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId } });
  if (!paciente) throw new AppError('Paciente não encontrado', 404);

  const exameIds = [...new Set(itens.map((i) => i.exameBaseId))];
  const examesValidos = await prisma.exameBase.count({
    where: { id: { in: exameIds }, clinicaId },
  });
  if (examesValidos !== exameIds.length) throw new AppError('Exame inválido', 400);

  const data = new Date(dataResultado);

  const solicitacao = await prisma.solicitacaoExame.create({
    data: {
      pacienteId,
      dataSolicitada: data,
      itens: {
        create: itens.map((item) => ({
          exameBaseId: item.exameBaseId,
          resultado: item.resultado,
          dataResultado: data,
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
  const clinicaId = getClinicaId(req);
  const { itemId, dataResultado, resultado } = req.body;

  const item = await prisma.solicitacaoExameItem.findFirst({
    where: { id: itemId, solicitacao: { paciente: { clinicaId } } },
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
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const existente = await prisma.solicitacaoExame.findFirst({
    where: { id, paciente: { clinicaId } },
  });
  if (!existente) throw new AppError('Solicitação não encontrada', 404);

  await prisma.solicitacaoExame.delete({ where: { id } });
  return res.json({ success: true, message: 'Solicitação excluída' });
}
