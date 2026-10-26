import { Request, Response } from 'express';
import { prisma } from '../../../shared/providers/prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import { getClinicaId } from '../../../shared/middlewares/auth.js';

async function garantirPacienteDaClinica(pacienteId: string, clinicaId: string) {
  const paciente = await prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId } });
  if (!paciente) throw new AppError('Paciente não encontrado', 404);
  return paciente;
}

// Evolução Clínica
export async function listarEvolucoes(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  await garantirPacienteDaClinica(pacienteId, clinicaId);

  const evolucoes = await prisma.evolucaoClinica.findMany({
    where: { pacienteId },
    orderBy: { criadoEm: 'desc' },
  });

  return res.json({ success: true, data: evolucoes });
}

export async function criarEvolucao(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  await garantirPacienteDaClinica(pacienteId, clinicaId);

  const evolucao = await prisma.evolucaoClinica.create({
    data: { ...req.body, pacienteId },
  });

  return res.status(201).json({ success: true, data: evolucao });
}

export async function editarEvolucao(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const existente = await prisma.evolucaoClinica.findFirst({
    where: { id, paciente: { clinicaId } },
  });
  if (!existente) throw new AppError('Evolução não encontrada', 404);

  const evolucao = await prisma.evolucaoClinica.update({
    where: { id },
    data: req.body,
  });

  return res.json({ success: true, data: evolucao });
}

// Medidas
export async function listarMedidas(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  await garantirPacienteDaClinica(pacienteId, clinicaId);

  const medidas = await prisma.medida.findMany({
    where: { pacienteId },
    orderBy: { data: 'desc' },
  });

  return res.json({ success: true, data: medidas });
}

export async function criarMedida(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  await garantirPacienteDaClinica(pacienteId, clinicaId);

  const medida = await prisma.medida.create({
    data: {
      ...req.body,
      pacienteId,
      data: new Date(req.body.data),
    },
  });

  return res.status(201).json({ success: true, data: medida });
}

export async function excluirMedida(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const existente = await prisma.medida.findFirst({
    where: { id, paciente: { clinicaId } },
  });
  if (!existente) throw new AppError('Medida não encontrada', 404);

  await prisma.medida.delete({ where: { id } });

  return res.json({ success: true, message: 'Medida excluída' });
}
