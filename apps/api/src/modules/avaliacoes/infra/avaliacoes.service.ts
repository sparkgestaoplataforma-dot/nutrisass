import { prisma } from "@/shared/providers/prisma";
import { AppError } from "@/shared/middlewares/errorHandler.js";

export async function pegarAvaliacaoPorId(id: string) {
  const avaliacao = await prisma.avaliacao.findFirst({
    where: { id },
    include: {
      questionario: {
        include: {
          regras: {
            orderBy: { pontuacaoMin: "asc" },
          },
        },
      },
    },
  });

  if (!avaliacao) {
    throw new AppError("Avaliação não encontrada", 404);
  }

  return {
    ...avaliacao,
    regraInterpretacao: avaliacao.questionario.regras.find(
      (regra) =>
        avaliacao.scoreTotal >= regra.pontuacaoMin &&
        avaliacao.scoreTotal <= regra.pontuacaoMax,
    )?.classificacao,
  };
}

export async function pegarAvaliacaoComRespostas(id: string) {
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { id },
    include: {
      questionario: {
        include: {
          labelEscolha: {
            orderBy: { nota: "asc" },
          },
          regras: {
            orderBy: { pontuacaoMin: "asc" },
          },
          modulos: {
            orderBy: { ordem: "asc" },
            include: {
              perguntas: {
                orderBy: { ordem: "asc" },
                include: {
                  respostas: {
                    where: {
                      avaliacaoId: id,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!avaliacao) {
    throw new AppError("Avaliação não encontrada", 404);
  }

  return {
    ...avaliacao,
    regraInterpretacao: avaliacao.questionario.regras.find(
      (regra) =>
        avaliacao.scoreTotal >= regra.pontuacaoMin &&
        avaliacao.scoreTotal <= regra.pontuacaoMax,
    )?.classificacao,
  };
}

export async function pegarAvaliacoesPorPacienteId(pacienteId: string) {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { pacienteId },
    orderBy: { dataRealizacao: "desc" },
    include: {
      questionario: {
        include: {
          regras: {
            orderBy: { pontuacaoMin: "asc" },
          },
        },
      },
    },
  });

  const avaliacoesComInterpretacao = avaliacoes.map((avaliacao) => {
    const regra = avaliacao.questionario.regras.find(
      (regra) =>
        avaliacao.scoreTotal >= regra.pontuacaoMin &&
        avaliacao.scoreTotal <= regra.pontuacaoMax,
    );

    return {
      ...avaliacao,
      regraInterpretacao: regra?.classificacao ?? null,
    };
  });

  return avaliacoesComInterpretacao;
}

export async function DeleteAvaliacao(id: string) {
  const avaliacaoDeletada = await prisma.avaliacao.delete({
    where: { id },
  });

  if (!avaliacaoDeletada) {
    throw new AppError("Avaliação não encontrada", 404);
  }
}
