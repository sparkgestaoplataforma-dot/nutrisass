import { Request, Response } from "express";
import { getIO } from "../../../shared/providers/socket.js";
import { getClinicaId } from "../../../shared/middlewares/auth.js";
import { getUsuarioId } from "../../../shared/middlewares/auth.js";
import { AppError } from "../../../shared/middlewares/errorHandler.js";

import * as service from "./agenda.service.js";
import { redisSet, redisLPush } from "@/shared/providers/redis.js";
import { enviarNotificacaoIndividual } from "@/modules/notificacoes/infra/notificacoes.controller.js";

function getMensagemIntuitiva(status: string, nomePaciente: string, dataFormatada: string): string {
  switch (status?.toUpperCase()) {
    case 'PRESENTE':
      return `O cliente ${nomePaciente} se encontra presente e pronto para ser atendido.`;
    case 'CANCELADO':
      return `O agendamento do dia ${dataFormatada} foi cancelado. Paciente: ${nomePaciente}.`;
    case 'CONFIRMOU':
      return `O paciente ${nomePaciente} confirmou presença para o dia ${dataFormatada}.`;
    case 'REALIZADO':
      return `O atendimento do paciente ${nomePaciente} foi finalizado com sucesso.`;
    case 'NAO_COMPARECEU':
      return `O paciente ${nomePaciente} não compareceu ao agendamento do dia ${dataFormatada}.`;
    case 'DESISTIU':
      return `O paciente ${nomePaciente} desistiu do agendamento do dia ${dataFormatada}.`;
    case 'REMARCOU':
      return `O paciente ${nomePaciente} remarcou o agendamento do dia ${dataFormatada}.`;
    case 'ENCAIXE':
      return `O paciente ${nomePaciente} foi encaixado na agenda do dia ${dataFormatada}.`;
    case 'AGENDADO':
    default:
      return `O status do agendamento do paciente ${nomePaciente} (${dataFormatada}) foi alterado para ${status}.`;
  }
}

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { data, nutricionistaId } = req.query;
  const usuarioId = getUsuarioId(req);
  const usuarioPerfil = req.user!.perfil;

  const dataStr = (data as string) || new Date().toISOString().split("T")[0];

  const targetNutricionistaId = (usuarioPerfil === "SECRETARIA" || usuarioPerfil === "ADMIN")
    ? (nutricionistaId ? (nutricionistaId as string) : undefined)
    : usuarioId;

  const agendamentos = await service.pegarAgendamentosDia(
    dataStr,
    clinicaId,
    targetNutricionistaId,
    usuarioPerfil as string,
  );

  return res.json({ success: true, data: agendamentos });
}

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);

  // Garantir que o emissor do agendamento é o usuário autenticado
  if (req.body.criadoPorUsuarioId !== req.user!.userId) {
    throw new AppError("O emissor do agendamento deve ser o usuário logado", 403);
  }

  // Se o usuário for nutricionista, ele só pode criar agendamentos para si mesmo
  if (req.user!.perfil === "NUTRICIONISTA") {
    if (req.body.nutricionistaId !== req.user!.userId) {
      throw new AppError("Nutricionista só pode criar agendamentos para si mesmo", 403);
    }
  }

  const agendamento = await service.criarAgendamento(
    req.body,
    req.user!.userId,
    clinicaId,
  );
  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(agendamento.dataHora));
  
  const notificacaoId = crypto.randomUUID();
  const notificacaoData = {
    id: notificacaoId,
    tipo: "AGENDAMENTO",
    titulo: "Novo agendamento",
    mensagem: `Novo agendamento marcado para o dia ${dataFormatada} com o paciente ${agendamento.paciente.nome}.`,
    agendamentoId: agendamento.id,
    createdAt: new Date().toISOString()
  }

  await enviarNotificacaoIndividual(notificacaoId, req.user!.userId, agendamento.nutricionistaId, notificacaoData);

  // await redisSet(
  //   `notificacao:${notificacaoId}`,
  //   JSON.stringify(notificacaoData)
  // );

  // if (req.user?.userId === agendamento.nutricionistaId) {
  //   getIO()
  //     .to(`usuario:${req.user!.userId}`)
  //     .emit("agenda:novo", notificacaoData);
  //   await redisLPush(`usuario:${req.user!.userId}:notificacoes`, notificacaoId);
  //   return res.status(201).json({ success: true, data: agendamento });

  // }
  // getIO()
  //   .to(`usuario:${req.user!.userId}`)
  //   .emit("agenda:novo", notificacaoData);

  // getIO()
  //   .to(`usuario:${agendamento.nutricionistaId}`)
  //   .emit("agenda:novo", notificacaoData);

  // await redisLPush(`usuario:${req.user!.userId}:notificacoes`, notificacaoId);
  // await redisLPush(`usuario:${agendamento.nutricionistaId}:notificacoes`, notificacaoId);
  return res.status(201).json({ success: true, data: agendamento });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const agendamento = await service.editarAgendamento(id, req.body);

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(agendamento.dataHora));

  let titulo = "Agendamento atualizado";
  let mensagem = `Os detalhes do agendamento do paciente ${agendamento.paciente.nome} para o dia ${dataFormatada} foram atualizados.`;

  if (req.body.status && req.body.dataHora) {
    mensagem = `O agendamento foi reagendado para ${dataFormatada} e o status alterado para ${agendamento.status}. Paciente: ${agendamento.paciente.nome}.`;
  } else if (req.body.status) {
    titulo = "Status do agendamento atualizado";
    mensagem = getMensagemIntuitiva(agendamento.status, agendamento.paciente.nome, dataFormatada);
  } else if (req.body.dataHora) {
    titulo = "Agendamento reagendado";
    mensagem = `O agendamento do paciente ${agendamento.paciente.nome} foi reagendado para o dia ${dataFormatada}.`;
  }

  const notificacaoId = crypto.randomUUID();
  const notificacaoData = {
    id: notificacaoId,
    tipo: "AGENDAMENTO",
    titulo,
    mensagem,
    agendamentoId: agendamento.id,
    createdAt: new Date().toISOString()
  };

  await enviarNotificacaoIndividual(notificacaoId, req.user!.userId, agendamento.nutricionistaId, notificacaoData);

  getIO().emit("agenda:atualizado", agendamento);

  return res.json({ success: true, data: agendamento });
}

export async function alterarStatus(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;
  const agendamento = await service.alterarStatusAgendamento(id, req.body);

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(agendamento.dataHora));
  const notificacaoId = crypto.randomUUID();
  const notificacaoData = {
    id: notificacaoId,
    tipo: "AGENDAMENTO",
    titulo: "Status do agendamento atualizado",
    mensagem: getMensagemIntuitiva(agendamento.status, agendamento.paciente.nome, dataFormatada),
    agendamentoId: agendamento.id,
    createdAt: new Date().toISOString()
  };

  await enviarNotificacaoIndividual(notificacaoId, req.user!.userId, agendamento.nutricionistaId, notificacaoData);

  getIO().emit("agenda:status", agendamento);

  return res.json({ success: true, data: agendamento });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const agendamento = await service.excluirAgendamento(id);

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(agendamento.dataHora));
  const notificacaoId = crypto.randomUUID();
  const notificacaoData = {
    id: notificacaoId,
    tipo: "AGENDAMENTO",
    titulo: "Agendamento excluído",
    mensagem: `O agendamento do dia ${dataFormatada} foi cancelado/excluído. Paciente: ${agendamento.paciente.nome}.`,
    agendamentoId: agendamento.id,
    createdAt: new Date().toISOString()
  };

  await enviarNotificacaoIndividual(notificacaoId, req.user!.userId, agendamento.nutricionistaId, notificacaoData);

  getIO().emit("agenda:excluido", { id });

  return res.json({ success: true, message: "Agendamento excluído" });
}
