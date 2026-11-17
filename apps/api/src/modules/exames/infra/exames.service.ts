import { prisma } from '@/shared/providers/prisma';
import { AppError } from '@/shared/middlewares/errorHandler';

function normalizeText(str: string): string {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ==========================================
// Exames Base (Configuração / Catálogo)
// ==========================================

export async function listarExamesBase(
  clinicaId: string,
  params: {
    tipo?: string;
    search?: string;
    page?: number;
    limit?: number;
    hasExplicitPage?: boolean;
  },
) {
  const { tipo, search, page = 1, limit } = params;
  const where: any = { clinicaId };
  if (tipo === 'base') where.isBase = true;
  if (tipo === 'custom') where.isBase = false;

  const pageNum = Math.max(1, page || 1);
  const requestedLimit = limit !== undefined ? limit : params.hasExplicitPage ? 20 : 100;
  const limitNum = Math.min(Math.max(1, requestedLimit || 20), 100);

  let exames = await prisma.exameBase.findMany({
    where,
    orderBy: { nome: 'asc' },
  });

  if (search && search.trim()) {
    const term = normalizeText(search.trim());
    exames = exames.filter(
      (e) => normalizeText(e.nome).includes(term) || normalizeText(e.codigo).includes(term),
    );
  }

  const total = exames.length;
  const skip = (pageNum - 1) * limitNum;
  const paginatedExames = exames.slice(skip, skip + limitNum);

  return {
    data: paginatedExames,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
}

export async function criarExameBase(clinicaId: string, dados: Record<string, any>) {
  const existente = await prisma.exameBase.findFirst({
    where: { clinicaId, codigo: dados.codigo },
  });
  if (existente) throw new AppError('Código de exame já existe', 409);

  return prisma.exameBase.create({
    data: { ...(dados as any), clinicaId, isBase: false },
  });
}

export async function editarExameBase(
  id: string,
  clinicaId: string,
  dados: Record<string, any>,
) {
  const existente = await prisma.exameBase.findFirst({ where: { id, clinicaId } });
  if (!existente) throw new AppError('Exame não encontrado', 404);
  if (existente.isBase) throw new AppError('Exames base não podem ser editados', 403);

  return prisma.exameBase.update({ where: { id }, data: dados as any });
}

export async function excluirExameBase(id: string, clinicaId: string) {
  const existente = await prisma.exameBase.findFirst({ where: { id, clinicaId } });
  if (!existente) throw new AppError('Exame não encontrado', 404);
  if (existente.isBase) throw new AppError('Exames base não podem ser excluídos', 403);

  await prisma.exameBase.delete({ where: { id } });
}

// ==========================================
// Solicitações e Resultados de Exame (Paciente)
// ==========================================

export async function listarSolicitacoesPaciente(pacienteId: string, clinicaId: string) {
  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId } });
  if (!paciente) throw new AppError('Paciente não encontrado', 404);

  return prisma.solicitacaoExame.findMany({
    where: { pacienteId },
    include: {
      itens: {
        include: { exameBase: true },
      },
    },
    orderBy: { dataSolicitada: 'desc' },
  });
}

export async function solicitarExamePaciente(
  pacienteId: string,
  clinicaId: string,
  exameBaseIds: string[],
) {
  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId } });
  if (!paciente) throw new AppError('Paciente não encontrado', 404);

  const exameIds = [...new Set<string>(exameBaseIds)];
  const examesValidos = await prisma.exameBase.count({
    where: { id: { in: exameIds }, clinicaId },
  });
  if (examesValidos !== exameIds.length) throw new AppError('Exame inválido', 400);

  return prisma.solicitacaoExame.create({
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
}

export async function lancarExameExternoPaciente(
  pacienteId: string,
  clinicaId: string,
  payload: {
    dataResultado: string;
    itens: { exameBaseId: string; resultado: string }[];
  },
) {
  const { dataResultado, itens } = payload;

  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId } });
  if (!paciente) throw new AppError('Paciente não encontrado', 404);

  const exameIds = [...new Set(itens.map((i) => i.exameBaseId))];
  const examesValidos = await prisma.exameBase.count({
    where: { id: { in: exameIds }, clinicaId },
  });
  if (examesValidos !== exameIds.length) throw new AppError('Exame inválido', 400);

  const data = new Date(dataResultado);

  return prisma.solicitacaoExame.create({
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
}

export async function registrarResultadoExame(
  clinicaId: string,
  payload: { itemId: string; dataResultado: string; resultado: string },
) {
  const { itemId, dataResultado, resultado } = payload;

  const item = await prisma.solicitacaoExameItem.findFirst({
    where: { id: itemId, solicitacao: { paciente: { clinicaId } } },
  });
  if (!item) throw new AppError('Item de solicitação não encontrado', 404);

  return prisma.solicitacaoExameItem.update({
    where: { id: itemId },
    data: {
      dataResultado: new Date(dataResultado),
      resultado,
    },
    include: { exameBase: true },
  });
}

export async function excluirSolicitacaoExame(id: string, clinicaId: string) {
  const existente = await prisma.solicitacaoExame.findFirst({
    where: { id, paciente: { clinicaId } },
  });
  if (!existente) throw new AppError('Solicitação não encontrada', 404);

  await prisma.solicitacaoExame.delete({ where: { id } });
}

