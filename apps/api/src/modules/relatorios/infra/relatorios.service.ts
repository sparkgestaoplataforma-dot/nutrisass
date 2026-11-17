import { prisma } from '@/shared/providers/prisma';

export async function gerarRelatorioAgendamentos(
  clinicaId: string,
  filtros: {
    dataInicio?: string;
    dataFim?: string;
    status?: string;
    convenioId?: string;
  } = {},
) {
  const { dataInicio, dataFim, status, convenioId } = filtros;

  const inicio = dataInicio
    ? new Date(dataInicio)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  inicio.setHours(0, 0, 0, 0);

  const fim = dataFim ? new Date(dataFim) : new Date();
  fim.setHours(23, 59, 59, 999);

  const where: any = {
    clinicaId,
    dataHora: { gte: inicio, lte: fim },
  };

  if (status) where.status = status;
  if (convenioId) where.convenioId = convenioId;

  const agendamentos = await prisma.agendamento.findMany({
    where,
    include: {
      paciente: { select: { id: true, nome: true, telefone: true } },
      convenio: { select: { id: true, nome: true } },
    },
    orderBy: { dataHora: 'asc' },
  });

  const totalRealizados = agendamentos.filter((a) => a.status === 'REALIZADO').length;
  const totalCancelados = agendamentos.filter(
    (a) => a.status === 'CANCELADO' || a.status === 'DESISTIU',
  ).length;

  return {
    agendamentos,
    resumo: {
      total: agendamentos.length,
      realizados: totalRealizados,
      cancelados: totalCancelados,
    },
  };
}

