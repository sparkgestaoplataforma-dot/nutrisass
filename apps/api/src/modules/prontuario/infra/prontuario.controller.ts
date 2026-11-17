import { Request, Response } from 'express';
import { getClinicaId } from '@/shared/middlewares/auth';
import * as prontuarioService from './prontuario.service';

// Evolução Clínica
export async function listarEvolucoes(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  const evolucoes = await prontuarioService.listarEvolucoesPaciente(pacienteId, clinicaId);
  return res.json({ success: true, data: evolucoes });
}

export async function criarEvolucao(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  const evolucao = await prontuarioService.criarEvolucaoPaciente(pacienteId, clinicaId, req.body);
  return res.status(201).json({ success: true, data: evolucao });
}

export async function editarEvolucao(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const evolucao = await prontuarioService.editarEvolucaoPaciente(id, clinicaId, req.body);
  return res.json({ success: true, data: evolucao });
}

export async function excluirEvolucao(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  await prontuarioService.excluirEvolucaoPaciente(id, clinicaId);
  return res.json({ success: true, message: 'Evolução excluída' });
}

// Medidas
export async function listarMedidas(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  const medidas = await prontuarioService.listarMedidasPaciente(pacienteId, clinicaId);
  return res.json({ success: true, data: medidas });
}

export async function criarMedida(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  const medida = await prontuarioService.criarMedidaPaciente(pacienteId, clinicaId, req.body);
  return res.status(201).json({ success: true, data: medida });
}

export async function editarMedida(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const medida = await prontuarioService.editarMedidaPaciente(id, clinicaId, req.body);
  return res.json({ success: true, data: medida });
}

export async function excluirMedida(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  await prontuarioService.excluirMedidaPaciente(id, clinicaId);
  return res.json({ success: true, message: 'Medida excluída' });
}
