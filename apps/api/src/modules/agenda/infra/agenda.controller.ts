import { Request, Response } from 'express';
import { getIO } from '../../../shared/providers/socket.js';
import { getClinicaId } from '../../../shared/middlewares/auth.js';
import * as service from './agenda.service.js';

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { data, usuarioId } = req.query;

  const dataStr = (data as string) || new Date().toISOString().split('T')[0];
  const agendamentos = await service.ListarAgendaDia(dataStr, clinicaId, usuarioId as string);

  return res.json({ success: true, data: agendamentos });
}

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const agendamento = await service.CriarAgendamento(req.body, req.user!.userId, clinicaId);

  getIO().emit('agenda:novo', agendamento);

  return res.status(201).json({ success: true, data: agendamento });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const agendamento = await service.EditarAgendamento(id, req.body);

  getIO().emit('agenda:atualizado', agendamento);

  return res.json({ success: true, data: agendamento });
}

export async function alterarStatus(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const agendamento = await service.AlterarStatus(id, req.body);

  getIO().emit('agenda:status', agendamento);

  return res.json({ success: true, data: agendamento });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  await service.ExcluirAgendamento(id);

  getIO().emit('agenda:excluido', { id });

  return res.json({ success: true, message: 'Agendamento excluído' });
}

