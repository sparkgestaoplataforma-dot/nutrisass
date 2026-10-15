import { prisma } from "../../../shared/providers/prisma.js";
import { AppError } from "../../../shared/middlewares/errorHandler.js";
import {
  CreatePacienteInput,
  UpdatePacienteInput,
  CreatePacienteQuestionarioAvaliacaoInput,
} from "@nutricao/shared";
import { pegarAvaliacoesPorPacienteId as buscarAvaliacoesService } from "../../avaliacoes/infra/avaliacoes.service.js";

export async function listarPacientes(
  clinicaId: string,
  busca?: string,
  page: number = 1,
  limit: number = 20,
) {
  const skip = (page - 1) * limit;

  const where: any = { clinicaId };

  if (busca && busca.trim()) {
    const termo = busca.trim();
    const cleanDigits = termo.replace(/\D/g, "");

    where.OR = [
      { nome: { contains: termo, mode: "insensitive" } },
      { email: { contains: termo, mode: "insensitive" } },
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
      skip,
      take: limit,
    }),
    prisma.paciente.count({ where }),
  ]);

  return {
    data: pacientes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
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

  if (!paciente) {
    throw new AppError("Paciente não encontrado", 404);
  }

  return paciente;
}

export async function criarPaciente(clinicaId: string, data: CreatePacienteInput) {
  // 1. Checa duplicidade de CPF na clínica
  const cpfExistente = await prisma.paciente.findFirst({
    where: { clinicaId, cpf: data.cpf },
  });

  if (cpfExistente) {
    throw new AppError("Já existe um paciente cadastrado com este CPF nesta clínica", 409);
  }

  // 2. Valida convênio, caso fornecido
  if (data.convenioId) {
    const convenio = await prisma.convenio.findFirst({
      where: { id: data.convenioId, clinicaId },
    });

    if (!convenio) {
      throw new AppError(
        "Convênio informado não pertence a esta clínica ou não foi encontrado",
        400,
      );
    }
  }

  try {
    const paciente = await prisma.paciente.create({
      data: {
        clinicaId,
        nome: data.nome,
        cpf: data.cpf,
        whatsapp: data.whatsapp,
        email: data.email ?? null,
        telefone: data.telefone ?? null,
        sexo: data.sexo ?? null,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
        identidade: data.identidade ?? null,
        ufIdentidade: data.ufIdentidade ?? null,
        orgaoExpedidor: data.orgaoExpedidor ?? null,
        endereco: data.endereco ?? null,
        bairro: data.bairro ?? null,
        municipio: data.municipio ?? null,
        uf: data.uf ?? null,
        cep: data.cep ?? null,
        profissao: data.profissao ?? null,
        escolaridade: data.escolaridade ?? null,
        nomeMae: data.nomeMae ?? null,
        convenioId: data.convenioId ?? null,
        numeroCarteira: data.numeroCarteira ?? null,
        validadeCarteira: data.validadeCarteira ? new Date(data.validadeCarteira) : null,
      },
      include: {
        convenio: { select: { id: true, nome: true } },
      },
    });

    return paciente;
  } catch (error: any) {
    // Trata violação de unicidade caso ocorra em concorrência (código Prisma P2002)
    if (error?.code === "P2002") {
      throw new AppError("Já existe um paciente cadastrado com este CPF nesta clínica", 409);
    }
    throw error;
  }
}

export async function editarPaciente(
  id: string,
  clinicaId: string,
  data: UpdatePacienteInput,
) {
  const existente = await prisma.paciente.findFirst({
    where: { id, clinicaId },
  });

  if (!existente) {
    throw new AppError("Paciente não encontrado", 404);
  }

  // Se o CPF está sendo alterado, verifica se outro paciente na mesma clínica já o possui
  if (data.cpf && data.cpf !== existente.cpf) {
    const outroComMesmoCpf = await prisma.paciente.findFirst({
      where: {
        clinicaId,
        cpf: data.cpf,
        id: { not: id },
      },
    });

    if (outroComMesmoCpf) {
      throw new AppError("Já existe outro paciente cadastrado com este CPF nesta clínica", 409);
    }
  }

  // Se o convênio está sendo alterado, verifica se pertence à clínica
  if (data.convenioId) {
    const convenio = await prisma.convenio.findFirst({
      where: { id: data.convenioId, clinicaId },
    });

    if (!convenio) {
      throw new AppError(
        "Convênio informado não pertence a esta clínica ou não foi encontrado",
        400,
      );
    }
  }

  const updateData: any = {};
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.cpf !== undefined) updateData.cpf = data.cpf;
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.telefone !== undefined) updateData.telefone = data.telefone;
  if (data.sexo !== undefined) updateData.sexo = data.sexo;
  if (data.dataNascimento !== undefined) {
    updateData.dataNascimento = data.dataNascimento ? new Date(data.dataNascimento) : null;
  }
  if (data.identidade !== undefined) updateData.identidade = data.identidade;
  if (data.ufIdentidade !== undefined) updateData.ufIdentidade = data.ufIdentidade;
  if (data.orgaoExpedidor !== undefined) updateData.orgaoExpedidor = data.orgaoExpedidor;
  if (data.endereco !== undefined) updateData.endereco = data.endereco;
  if (data.bairro !== undefined) updateData.bairro = data.bairro;
  if (data.municipio !== undefined) updateData.municipio = data.municipio;
  if (data.uf !== undefined) updateData.uf = data.uf;
  if (data.cep !== undefined) updateData.cep = data.cep;
  if (data.profissao !== undefined) updateData.profissao = data.profissao;
  if (data.escolaridade !== undefined) updateData.escolaridade = data.escolaridade;
  if (data.nomeMae !== undefined) updateData.nomeMae = data.nomeMae;
  if (data.convenioId !== undefined) updateData.convenioId = data.convenioId;
  if (data.numeroCarteira !== undefined) updateData.numeroCarteira = data.numeroCarteira;
  if (data.validadeCarteira !== undefined) {
    updateData.validadeCarteira = data.validadeCarteira ? new Date(data.validadeCarteira) : null;
  }

  try {
    const atualizado = await prisma.paciente.update({
      where: { id },
      data: updateData,
      include: {
        convenio: { select: { id: true, nome: true } },
      },
    });

    return atualizado;
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new AppError("Já existe outro paciente cadastrado com este CPF nesta clínica", 409);
    }
    throw error;
  }
}

export async function excluirPaciente(id: string, clinicaId: string) {
  const existente = await prisma.paciente.findFirst({
    where: { id, clinicaId },
    include: {
      _count: {
        select: {
          agendamentos: true,
          evolucoes: true,
          medidas: true,
          solicitacoes: true,
          avaliacoesQuestionarios: true,
          planosAlimentares: true,
        },
      },
    },
  });

  if (!existente) {
    throw new AppError("Paciente não encontrado", 404);
  }

  // Regra de retenção de dados clínicos: impede exclusão física quando houver histórico assistencial
  const registrosVinculados =
    existente._count.agendamentos +
    existente._count.evolucoes +
    existente._count.medidas +
    existente._count.solicitacoes +
    existente._count.avaliacoesQuestionarios +
    existente._count.planosAlimentares;

  if (registrosVinculados > 0) {
    throw new AppError(
      "Não é possível excluir o paciente pois existem agendamentos ou registros clínicos vinculados ao seu prontuário.",
      400,
    );
  }

  await prisma.paciente.delete({
    where: { id },
  });

  return { message: "Paciente excluído com sucesso" };
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
