import { prisma } from "@/shared/providers/prisma";
import { AppError } from "@/shared/middlewares/errorHandler";
import { CreatePacienteQuestionarioAvaliacaoInput } from "@nutricao/shared";
import { pegarAvaliacoesPorPacienteId as buscarAvaliacoesService } from "../../avaliacoes/infra/avaliacoes.service";

export async function listarPacientesClinica(
  clinicaId: string,
  params: { busca?: string; page?: number; limit?: number } = {},
) {
  const { busca, page = 1, limit = 20 } = params;
  const where: any = { clinicaId };

  if (busca) {
    const termo = busca;
    const cleanDigits = termo.replace(/\D/g, "");
    where.OR = [
      { nome: { contains: termo, mode: "insensitive" as const } },
      { email: { contains: termo, mode: "insensitive" as const } },
      { telefone: { contains: termo } },
      { whatsapp: { contains: termo } },
      { cpf: { contains: termo } },
    ];
    if (cleanDigits && cleanDigits !== termo) {
      where.OR.push(
        { telefone: { contains: cleanDigits } },
        { whatsapp: { contains: cleanDigits } },
        { cpf: { contains: cleanDigits } },
      );
    }
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [pacientes, total] = await Promise.all([
    prisma.paciente.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        whatsapp: true,
        cpf: true,
        convenio: { select: { id: true, nome: true } },
      },
      orderBy: { nome: "asc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.paciente.count({ where }),
  ]);

  return {
    data: pacientes,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
}

export async function buscarPacientePorId(id: string, clinicaId: string) {
  const paciente = await prisma.paciente.findFirst({
    where: { id, clinicaId },
    include: {
      convenio: { select: { id: true, nome: true } },
      agendamentos: {
        orderBy: { dataHora: "desc" },
        take: 10,
        include: { convenio: { select: { nome: true } } },
      },
    },
  });

  if (!paciente) throw new AppError("Paciente não encontrado", 404);
  return paciente;
}

export async function criarPacienteClinica(clinicaId: string, body: Record<string, any>) {
  const {
    id: _id,
    clinicaId: _clinicaId,
    criadoEm: _criadoEm,
    atualizadoEm: _atualizadoEm,
    convenio: _convenio,
    agendamentos: _agendamentos,
    ...dados
  } = body;

  return prisma.paciente.create({
    data: {
      ...(dados as any),
      clinicaId,
      sexo: dados.sexo || null,
      convenioId: dados.convenioId || null,
      dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : null,
      validadeCarteira: dados.validadeCarteira ? new Date(dados.validadeCarteira) : null,
    },
  });
}

export async function editarPacienteClinica(
  id: string,
  clinicaId: string,
  body: Record<string, any>,
) {
  const existente = await prisma.paciente.findFirst({
    where: { id, clinicaId },
  });
  if (!existente) throw new AppError("Paciente não encontrado", 404);

  const {
    id: _id,
    clinicaId: _clinicaId,
    criadoEm: _criadoEm,
    atualizadoEm: _atualizadoEm,
    convenio: _convenio,
    agendamentos: _agendamentos,
    evolucoes: _evolucoes,
    medidas: _medidas,
    solicitacoes: _solicitacoes,
    avaliacoesQuestionarios: _avaliacoesQuestionarios,
    respostasQuestionarios: _respostasQuestionarios,
    planosAlimentares: _planosAlimentares,
    ...dados
  } = body;

  return prisma.paciente.update({
    where: { id },
    data: {
      ...dados,
      sexo: dados.sexo || null,
      convenioId: dados.convenioId || null,
      dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : null,
      validadeCarteira: dados.validadeCarteira ? new Date(dados.validadeCarteira) : null,
    },
  });
}

export async function excluirPacienteClinica(id: string, clinicaId: string) {
  const existente = await prisma.paciente.findFirst({
    where: { id, clinicaId },
  });
  if (!existente) throw new AppError("Paciente não encontrado", 404);

  await prisma.paciente.delete({ where: { id } });
}

export async function criarAvaliacaoPaciente(
  id: string,
  questionarioId: string,
  data: CreatePacienteQuestionarioAvaliacaoInput,
) {
  const { respostas } = data;

  const paciente = await prisma.paciente.findUnique({
    where: { id },
  });

  if (!paciente) {
    throw new AppError("Paciente não encontrado", 404);
  }

  const questionario = await prisma.questionario.findUnique({
    where: { id: questionarioId },
  });

  if (!questionario) {
    throw new AppError("Questionário não encontrado", 404);
  }

  if (!questionario.ativo) {
    throw new AppError(
      "Questionário inativo. Utilize a versão ativa mais recente",
      400,
    );
  }

  if (paciente.clinicaId !== questionario.clinicaId) {
    throw new AppError(
      "Paciente e questionário não pertencem à mesma clínica",
      400,
    );
  }

  const scoreTotal = respostas.reduce((acc, r) => acc + r.nota, 0);

  const avaliacao = await prisma.avaliacao.create({
    data: {
      clinicaId: paciente.clinicaId,
      pacienteId: id,
      questionarioId,
      scoreTotal,
      respostas: {
        create: respostas.map((resposta) => ({
          pacienteId: id,
          perguntaId: resposta.perguntaId,
          nota: resposta.nota,
        })),
      },
    },
  });

  return avaliacao;
}

export async function pegarNomePacientePorId(id: string) {
  const paciente = await prisma.paciente.findUnique({
    where: { id },
    select: { nome: true },
  });

  if (!paciente) {
    throw new AppError("Paciente não encontrado", 404);
  }

  return paciente.nome;
}

export async function pegarAvaliacoesPaciente(
  pacienteId: string,
  clinicaId: string,
  page?: number,
  limit?: number,
) {
  return buscarAvaliacoesService(pacienteId, clinicaId, page, limit);
}
