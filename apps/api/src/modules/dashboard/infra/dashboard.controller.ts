import { Request, Response } from 'express';
import { prisma } from '../../../shared/providers/prisma.js';

export async function getDashboard(req: Request, res: Response) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    totalPacientes,
    pacientesMes,
    agendaHoje,
    agendamentosMes,
    realizadosMes,
    canceladosMes,
    naoCompareceuMes,
    proximosAgendamentos,
  ] = await Promise.all([
    prisma.paciente.count(),

    prisma.paciente.count({
      where: { criadoEm: { gte: inicioMes, lte: fimMes } },
    }),

    prisma.agendamento.count({
      where: { dataHora: { gte: hoje, lt: amanha } },
    }),

    prisma.agendamento.count({
      where: { dataHora: { gte: inicioMes, lte: fimMes } },
    }),

    prisma.agendamento.count({
      where: {
        dataHora: { gte: inicioMes, lte: fimMes },
        status: 'REALIZADO',
      },
    }),

    prisma.agendamento.count({
      where: {
        dataHora: { gte: inicioMes, lte: fimMes },
        status: { in: ['CANCELADO', 'DESISTIU'] },
      },
    }),

    prisma.agendamento.count({
      where: {
        dataHora: { gte: inicioMes, lte: fimMes },
        status: 'NAO_COMPARECEU',
      },
    }),

    prisma.agendamento.findMany({
      where: { dataHora: { gte: hoje, lt: amanha } },
      include: {
        paciente: { select: { id: true, nome: true, telefone: true } },
        convenio: { select: { id: true, nome: true } },
      },
      orderBy: { dataHora: 'asc' },
      take: 20,
    }),
  ]);

  return res.json({
    success: true,
    data: {
      totalPacientes,
      pacientesMes,
      agendaHoje,
      agendamentosMes,
      realizadosMes,
      canceladosMes,
      naoCompareceuMes,
      proximosAgendamentos,
    },
  });
}
