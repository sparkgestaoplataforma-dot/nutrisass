import { z } from "zod";
import { prisma } from "../../../shared/providers/prisma.js";
import { AppError } from "../../../shared/middlewares/errorHandler.js";
import type {
  CreateAgendamentoInput,
  UpdateAgendamentoInput,
  UpdateStatusInput,
} from "@nutricao/shared";
import { criarNotificacao } from "../../notificacao/infra/notificacao.service.js";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function pegarAgendamentosDia(
  data: string,
  clinicaId: string,
  usuarioId?: string,
  usuarioPerfil?: string,
) {
  const schema = z.object({
    clinicaId: z.string().uuid("ID da clínica inválido"),
    usuarioId: z.string().uuid("ID do usuário inválido").optional(),
  });

  const { clinicaId: vClinicaId, usuarioId: vUsuarioId } = schema.parse({
    clinicaId,
    usuarioId,
  });

  const inicio = parseLocalDate(data);
  inicio.setHours(0, 0, 0, 0);

  const fim = parseLocalDate(data);
  fim.setHours(23, 59, 59, 999);

  const where: any = {
    clinicaId: vClinicaId,
    dataHora: { gte: inicio, lte: fim },
  };

  if (vUsuarioId) {
    where.nutricionistaId = vUsuarioId;
  }

  const agendamentos = await prisma.agendamento.findMany({
    where,
    include: {
      paciente: {
        select: { id: true, nome: true, telefone: true, email: true },
      },
      nutricionista: { select: { nome: true } },
      convenio: { select: { id: true, nome: true } },
    },
    orderBy: { dataHora: "asc" },
  });

  return agendamentos;
}

export async function criarAgendamento(
  input: CreateAgendamentoInput,
  usuarioId: string,
  clinicaId: string,
) {
  const [paciente, nutricionista] = await Promise.all([
    prisma.paciente.findUnique({ where: { id: input.pacienteId } }),
    prisma.usuario.findUnique({ where: { id: input.nutricionistaId } }),
  ]);

  if (!paciente) throw new AppError("Paciente não encontrado", 404);
  if (!nutricionista) throw new AppError("Nutricionista não encontrado", 404);

  const dataHora = new Date(input.dataHora);

  const agendamento = await prisma.agendamento.create({
    data: {
      clinicaId,
      pacienteId: input.pacienteId,
      criadoPorUsuarioId: input.criadoPorUsuarioId,
      nutricionistaId: nutricionista.id,
      convenioId: input.convenioId || null,
      dataHora,
      tipo: input.tipo,
      status: input.status || "AGENDADO",
      encaixe: input.encaixe || false,
      observacao: input.observacao || null,
    },
    include: {
      paciente: { select: { id: true, nome: true, telefone: true } },
      convenio: { select: { id: true, nome: true } },
    },
  });

  await criarNotificacao({
    clinicaId,
    usuarioId: nutricionista.id,
    tipo: "LEMBRETE_CONSULTA",
    titulo: "Novo agendamento criado",
    mensagem: `${paciente.nome} agendou uma consulta com ${nutricionista.nome} para ${format(dataHora, "dd/MM 'às' HH:mm", { locale: ptBR })}.`,
  }).catch((err) =>
    console.error("Falha ao emitir notificação de agendamento:", err),
  );

  return agendamento;
}

export async function editarAgendamento(
  id: string,
  input: UpdateAgendamentoInput,
) {
  const existente = await prisma.agendamento.findUnique({ where: { id } });

  if (!existente) {
    throw new AppError("Agendamento não encontrado", 404);
  }

  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: {
      ...(input.pacienteId && { pacienteId: input.pacienteId }),
      ...(input.convenioId !== undefined && {
        convenioId: input.convenioId || null,
      }),
      ...(input.dataHora && { dataHora: new Date(input.dataHora) }),
      ...(input.tipo && { tipo: input.tipo }),
      ...(input.status && { status: input.status }),
      ...(input.encaixe !== undefined && { encaixe: input.encaixe }),
      ...(input.observacao !== undefined && {
        observacao: input.observacao || null,
      }),
    },
    include: {
      paciente: {
        select: { id: true, nome: true, telefone: true, email: true },
      },
      convenio: { select: { id: true, nome: true } },
    },
  });

  return agendamento;
}

export async function alterarStatusAgendamento(
  id: string,
  input: UpdateStatusInput,
) {
  const existente = await prisma.agendamento.findUnique({
    where: { id },
    include: { paciente: true },
  });

  if (!existente) {
    throw new AppError("Agendamento não encontrado", 404);
  }

  const statusAnterior = existente.status;
  const novoStatus = input.status;

  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: { status: novoStatus },
    include: {
      paciente: { select: { id: true, nome: true, telefone: true } },
      convenio: { select: { id: true, nome: true } },
    },
  });

  if (novoStatus === "PRESENTE" && statusAnterior !== "PRESENTE") {
    await criarNotificacao({
      clinicaId: agendamento.clinicaId,
      usuarioId: agendamento.criadoPorUsuarioId,
      tipo: "PACIENTE_CHEGOU",
      titulo: "Paciente chegou",
      mensagem: `${agendamento.paciente.nome} confirmou presença para a consulta das ${format(agendamento.dataHora, "HH:mm")}.`,
    }).catch((err) =>
      console.error("Falha ao emitir notificação de presença:", err),
    );
  }

  return agendamento;
}

export async function excluirAgendamento(id: string) {
  const existente = await prisma.agendamento.findUnique({ where: { id } });

  if (!existente) {
    throw new AppError("Agendamento não encontrado", 404);
  }

  await prisma.agendamento.delete({ where: { id } });
  return { message: "Agendamento excluído" };
}
