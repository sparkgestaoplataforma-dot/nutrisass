import { Request, Response } from 'express';
import { criarAgendamentoUseCase } from '../application/criarAgendamento.usecase.js';
import { listarAgendaDiaUseCase } from '../application/listarAgendaDia.usecase.js';
import { editarAgendamentoUseCase } from '../application/editarAgendamento.usecase.js';
import { alterarStatusUseCase } from '../application/alterarStatus.usecase.js';
import { excluirAgendamentoUseCase } from '../application/excluirAgendamento.usecase.js';
import { getIO } from '../../../shared/providers/socket.js';

export async function listar(req: Request, res: Response) {
  const { data, usuarioId } = req.query;

  const dataStr = (data as string) || new Date().toISOString().split('T')[0];
  const agendamentos = await listarAgendaDiaUseCase(dataStr, usuarioId as string);

  return res.json({ success: true, data: agendamentos });
}

export async function criar(req: Request, res: Response) {
  const agendamento = await criarAgendamentoUseCase(req.body, req.user!.userId);

  getIO().emit('agenda:novo', agendamento);

  return res.status(201).json({ success: true, data: agendamento });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const agendamento = await editarAgendamentoUseCase(id, req.body);

  getIO().emit('agenda:atualizado', agendamento);

  return res.json({ success: true, data: agendamento });
}

export async function alterarStatus(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const agendamento = await alterarStatusUseCase(id, req.body);

  getIO().emit('agenda:status', agendamento);

  return res.json({ success: true, data: agendamento });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  await excluirAgendamentoUseCase(id);

  getIO().emit('agenda:excluido', { id });

  return res.json({ success: true, message: 'Agendamento excluído' });
}
