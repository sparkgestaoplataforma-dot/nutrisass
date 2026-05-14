import { z } from "zod";
import { prisma } from "../../../shared/providers/prisma.js";

export async function pegarDadosDashboard(clinicaId: string, nutricionistaId: string) {
  const schema = z.object({
    clinicaId: z.string().uuid("ID da clínica inválido"),
    nutricionistaId: z.string().uuid("O ID do nutricionista é obrigatório para o dashboard"),
  });

  const { clinicaId: vClinicaId, nutricionistaId: vNutricionistaId } = schema.parse({ 
    clinicaId, 
    nutricionistaId 
  });

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
    prisma.paciente.count({ where: { clinicaId: vClinicaId } }),

    prisma.paciente.count({
      where: { clinicaId: vClinicaId, criadoEm: { gte: inicioMes, lte: fimMes } },
    }),

    prisma.agendamento.count({
      where: { clinicaId: vClinicaId, nutricionistaId: vNutricionistaId, dataHora: { gte: hoje, lt: amanha } },
    }),

    prisma.agendamento.count({
      where: { clinicaId: vClinicaId, nutricionistaId: vNutricionistaId, dataHora: { gte: inicioMes, lte: fimMes } },
    }),

    prisma.agendamento.count({
      where: {
        clinicaId: vClinicaId,
        nutricionistaId: vNutricionistaId,
        dataHora: { gte: inicioMes, lte: fimMes },
        status: 'REALIZADO',
      },
    }),

    prisma.agendamento.count({
      where: {
        clinicaId: vClinicaId,
        nutricionistaId: vNutricionistaId,
        dataHora: { gte: inicioMes, lte: fimMes },
        status: { in: ['CANCELADO', 'DESISTIU'] },
      },
    }),

    prisma.agendamento.count({
      where: {
        clinicaId: vClinicaId,
        nutricionistaId: vNutricionistaId,
        dataHora: { gte: inicioMes, lte: fimMes },
        status: 'NAO_COMPARECEU',
      },
    }),

    prisma.agendamento.findMany({
      where: { clinicaId: vClinicaId, nutricionistaId: vNutricionistaId, dataHora: { gte: hoje, lt: amanha } },
      include: {
        paciente: { select: { id: true, nome: true, telefone: true } },
        convenio: { select: { id: true, nome: true } },
      },
      orderBy: { dataHora: 'asc' },
      take: 20,
    }),
  ]);

  return {
    totalPacientes,
    pacientesMes,
    agendaHoje,
    agendamentosMes,
    realizadosMes,
    canceladosMes,
    naoCompareceuMes,
    proximosAgendamentos,
  };
}
