import { Request, Response } from "express";
import { getIO } from "../../../shared/providers/socket.js";
import { getClinicaId } from "../../../shared/middlewares/auth.js";
import { getUsuarioId } from "../../../shared/middlewares/auth.js";

import * as service from "./agenda.service.js";

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { data } = req.query;
  const usuarioId = getUsuarioId(req);
  const usuarioPerfil = req.user!.perfil;

  const dataStr = (data as string) || new Date().toISOString().split("T")[0];
  const agendamentos = await service.pegarAgendamentosDia(
    dataStr,
    clinicaId,
    usuarioId as string,
    usuarioPerfil as string,
  );

  return res.json({ success: true, data: agendamentos });
}

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const agendamento = await service.criarAgendamento(
    req.body,
    req.user!.userId,
    clinicaId,
  );

  getIO().emit("agenda:novo", agendamento);

  return res.status(201).json({ success: true, data: agendamento });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const agendamento = await service.editarAgendamento(id, req.body);

  getIO().emit("agenda:atualizado", agendamento);

  return res.json({ success: true, data: agendamento });
}

export async function alterarStatus(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;
  const agendamento = await service.alterarStatusAgendamento(id, req.body);

  getIO().emit("agenda:status", agendamento);

  return res.json({ success: true, data: agendamento });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  await service.excluirAgendamento(id);

  getIO().emit("agenda:excluido", { id });

  return res.json({ success: true, message: "Agendamento excluído" });
}
