import { prisma } from '@/shared/providers/prisma';
import { AppError } from '@/shared/middlewares/errorHandler';

async function garantirPacienteDaClinica(pacienteId: string, clinicaId: string) {
  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId } });
  if (!paciente) throw new AppError('Paciente não encontrado', 404);
  return paciente;
}

// ==========================================
// Evolução Clínica
// ==========================================

export async function listarEvolucoesPaciente(pacienteId: string, clinicaId: string) {
  await garantirPacienteDaClinica(pacienteId, clinicaId);

  return prisma.evolucaoClinica.findMany({
    where: { pacienteId },
    orderBy: { criadoEm: 'desc' },
  });
}

export async function criarEvolucaoPaciente(
  pacienteId: string,
  clinicaId: string,
  dados: Record<string, unknown>,
) {
  await garantirPacienteDaClinica(pacienteId, clinicaId);

  return prisma.evolucaoClinica.create({
    data: { ...(dados as any), pacienteId },
  });
}

export async function editarEvolucaoPaciente(
  id: string,
  clinicaId: string,
  dados: Record<string, unknown>,
) {
  const existente = await prisma.evolucaoClinica.findFirst({
    where: { id, paciente: { clinicaId } },
  });
  if (!existente) throw new AppError('Evolução não encontrada', 404);

  return prisma.evolucaoClinica.update({
    where: { id },
    data: dados as any,
  });
}

export async function excluirEvolucaoPaciente(id: string, clinicaId: string) {
  const existente = await prisma.evolucaoClinica.findFirst({
    where: { id, paciente: { clinicaId } },
  });
  if (!existente) throw new AppError('Evolução não encontrada', 404);

  await prisma.evolucaoClinica.delete({ where: { id } });
}

// ==========================================
// Medidas Antropométricas
// ==========================================

export async function listarMedidasPaciente(pacienteId: string, clinicaId: string) {
  await garantirPacienteDaClinica(pacienteId, clinicaId);

  return prisma.medida.findMany({
    where: { pacienteId },
    orderBy: { data: 'desc' },
  });
}

export async function criarMedidaPaciente(
  pacienteId: string,
  clinicaId: string,
  dados: Record<string, any>,
) {
  await garantirPacienteDaClinica(pacienteId, clinicaId);

  return prisma.medida.create({
    data: {
      ...dados,
      pacienteId,
      data: new Date(dados.data),
    },
  });
}

export async function editarMedidaPaciente(
  id: string,
  clinicaId: string,
  dados: Record<string, any>,
) {
  const existente = await prisma.medida.findFirst({
    where: { id, paciente: { clinicaId } },
  });
  if (!existente) throw new AppError('Medida não encontrada', 404);

  const { pacienteId: _ignorePacienteId, data, ...rest } = dados;
  const updateData: Record<string, unknown> = { ...rest };
  if (data) {
    updateData.data = new Date(data);
  }

  return prisma.medida.update({
    where: { id },
    data: updateData,
  });
}

export async function excluirMedidaPaciente(id: string, clinicaId: string) {
  const existente = await prisma.medida.findFirst({
    where: { id, paciente: { clinicaId } },
  });
  if (!existente) throw new AppError('Medida não encontrada', 404);

  await prisma.medida.delete({ where: { id } });
}

