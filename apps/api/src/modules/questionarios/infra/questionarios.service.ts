import { prisma } from "@/shared/providers/prisma";
import { AppError } from "@/shared/middlewares/errorHandler.js";
import {
  CreateQuestionarioInput,
  CreateQuestionarioModuloInput,
  CreateQuestionarioRegrasInterpretacaoInput,
} from "@nutricao/shared";

export async function criar(clinicaId: string, data: CreateQuestionarioInput) {
  const clinica = await prisma.clinica.findUnique({
    where: { id: clinicaId },
  });

  if (!clinica) {
    throw new AppError("Clínica não encontrada", 404);
  }

  const questionarioExistente = await prisma.questionario.findFirst({
    where: { clinicaId, nome: data.nome, versao: data.versao ?? 1 },
  });

  if (questionarioExistente) {
    throw new AppError("Esse questionário já existe", 400);
  }

  const questionario = await prisma.questionario.create({
    data: {
      ...data,
      versao: data.versao ?? 1,
      clinicaId,
    },
  });

  return questionario;
}

export async function adicionarModulo(
  clinicaId: string,
  questionarioId: string,
  data: CreateQuestionarioModuloInput,
) {
  const questionario = await prisma.questionario.findFirst({
    where: { id: questionarioId, clinicaId },
    select: { id: true },
  });

  if (!questionario) {
    throw new AppError("Questionário não encontrado para a clínica", 404);
  }

  const modulo = await prisma.$transaction(async (tx) => {
    await tx.modulo.updateMany({
      where: { questionarioId, ordem: { gte: data.ordem } },
      data: { ordem: { increment: 1 } },
    });

    return tx.modulo.create({
      data: {
        nome: data.nome,
        ordem: data.ordem,
        questionarioId,
      },
    });
  });

  return modulo;
}

export async function adicionarRegra(
  clinicaId: string,
  questionarioId: string,
  data: CreateQuestionarioRegrasInterpretacaoInput,
) {
  const questionario = await prisma.questionario.findFirst({
    where: { id: questionarioId, clinicaId },
    select: { id: true },
  });

  if (!questionario) {
    throw new AppError("Questionário não encontrado para a clínica", 404);
  }

  if (data.pontuacaoMin > data.pontuacaoMax) {
    throw new AppError(
      "pontuacaoMin deve ser menor ou igual à pontuacaoMax",
      400,
    );
  }

  const faixaSobreposta = await prisma.regraInterpretacao.findFirst({
    where: {
      questionarioId,
      NOT: [
        { pontuacaoMax: { lt: data.pontuacaoMin } },
        { pontuacaoMin: { gt: data.pontuacaoMax } },
      ],
    },
    select: { id: true },
  });

  if (faixaSobreposta) {
    throw new AppError(
      "Faixa de pontuação sobreposta com regra existente",
      400,
    );
  }

  const regra = await prisma.regraInterpretacao.create({
    data: {
      questionarioId,
      pontuacaoMin: data.pontuacaoMin,
      pontuacaoMax: data.pontuacaoMax,
      classificacao: data.classificacao,
    },
  });

  return regra;
}
