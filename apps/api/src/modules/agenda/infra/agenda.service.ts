import { z } from "zod";
import { prisma } from "../../../shared/providers/prisma.js";
import { AppError } from "../../../shared/middlewares/errorHandler.js";
import type {
  CreateAgendamentoInput,
  UpdateAgendamentoInput,
  UpdateStatusInput,
} from "@nutricao/shared";


function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

async function verificarConflitoHorario(
  nutricionistaId: string,
  dataHora: Date,
  encaixe: boolean,
  excluirAgendamentoId?: string
) {
  if (encaixe) {
    return;
  }

  const conflito = await prisma.agendamento.findFirst({
    where: {
      nutricionistaId,
      dataHora,
      status: {
        notIn: ["CANCELADO", "NAO_COMPARECEU", "DESISTIU", "REMARCOU"],
      },
      encaixe: false,
      ...(excluirAgendamentoId && { id: { not: excluirAgendamentoId } }),
    },
  });

  if (conflito) {
    throw new AppError(
      "Já existe um agendamento ativo para este nutricionista neste horário. Caso deseje marcar no mesmo horário, utilize a opção de Encaixe.",
      400
    );
  }
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

  await verificarConflitoHorario(
    nutricionista.id,
    dataHora,
    input.encaixe || false
  );

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

  const dataHora = input.dataHora ? new Date(input.dataHora) : existente.dataHora;
  const nutricionistaId = input.nutricionistaId || existente.nutricionistaId;
  const encaixe = input.encaixe !== undefined ? input.encaixe : existente.encaixe;

  await verificarConflitoHorario(nutricionistaId, dataHora, encaixe, id);

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

  const statusInativos = ["CANCELADO", "NAO_COMPARECEU", "DESISTIU", "REMARCOU"];
  const statusAnteriorInativo = statusInativos.includes(statusAnterior);
  const novoStatusAtivo = !statusInativos.includes(novoStatus);

  if (statusAnteriorInativo && novoStatusAtivo) {
    await verificarConflitoHorario(
      existente.nutricionistaId,
      existente.dataHora,
      existente.encaixe,
      id
    );
  }

  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: { status: novoStatus },
    include: {
      paciente: { select: { id: true, nome: true, telefone: true } },
      convenio: { select: { id: true, nome: true } },
    },
  });

  return agendamento;
}

export async function excluirAgendamento(id: string) {
  const existente = await prisma.agendamento.findUnique({ where: { id } });

  if (!existente) {
    throw new AppError("Agendamento não encontrado", 404);
  }

  const deleted = await prisma.agendamento.delete({ 
    where: { id },
    include: { paciente: { select: { nome: true } } }
  });
  return deleted;
}
