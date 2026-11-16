import { prisma } from '@/shared/providers/prisma';
import { AppError } from '@/shared/middlewares/errorHandler';

function normalizeText(str: string): string {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export async function listarConvenios(
  clinicaId: string,
  params: {
    search?: string;
    page?: number;
    limit?: number;
    hasExplicitPage?: boolean;
  } = {},
) {
  const { search, page = 1, limit } = params;
  const pageNum = Math.max(1, page || 1);
  const requestedLimit = limit !== undefined ? limit : params.hasExplicitPage ? 20 : 100;
  const limitNum = Math.min(Math.max(1, requestedLimit || 20), 100);

  let convenios = await prisma.convenio.findMany({
    where: { clinicaId },
    orderBy: { nome: 'asc' },
  });

  if (search && search.trim()) {
    const term = normalizeText(search.trim());
    convenios = convenios.filter(
      (c) =>
        normalizeText(c.nome).includes(term) ||
        (c.registroANS && normalizeText(c.registroANS).includes(term)),
    );
  }

  const total = convenios.length;
  const skip = (pageNum - 1) * limitNum;
  const paginatedConvenios = convenios.slice(skip, skip + limitNum);

  return {
    data: paginatedConvenios,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
}

export async function criarConvenio(clinicaId: string, dados: Record<string, any>) {
  return prisma.convenio.create({
    data: { ...(dados as any), clinicaId },
  });
}

export async function editarConvenio(
  id: string,
  clinicaId: string,
  dados: Record<string, any>,
) {
  const existente = await prisma.convenio.findFirst({ where: { id, clinicaId } });
  if (!existente) throw new AppError('Convênio não encontrado', 404);

  return prisma.convenio.update({ where: { id }, data: dados as any });
}

export async function excluirConvenio(id: string, clinicaId: string) {
  const existente = await prisma.convenio.findFirst({ where: { id, clinicaId } });
  if (!existente) throw new AppError('Convênio não encontrado', 404);

  await prisma.convenio.delete({ where: { id } });
}

