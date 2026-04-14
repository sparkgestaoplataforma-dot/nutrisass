import { prisma } from "@/shared/providers/prisma";
import { AppError } from "@/shared/middlewares/errorHandler.js";

export async function pegarAvaliacaoPorId(id: string, clinicaId: string) {
  const avaliacao = await prisma.avaliacao.findFirst({
    where: { id, clinicaId },
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

export async function pegarAvaliacaoComRespostas(id: string, clinicaId: string) {
  const avaliacao = await prisma.avaliacao.findFirst({
    where: { id, clinicaId },
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

export async function pegarAvaliacoesPorPacienteId(
  pacienteId: string,
  clinicaId: string,
) {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { pacienteId, clinicaId },
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

  return avaliacoes.map((avaliacao) => {
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
}

export async function excluirAvaliacao(id: string, clinicaId: string) {
  const avaliacao = await prisma.avaliacao.findFirst({
    where: { id, clinicaId },
  });

  if (!avaliacao) {
    throw new AppError("Avaliação não encontrada", 404);
  }

  await prisma.avaliacao.delete({ where: { id } });
}
