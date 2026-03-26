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

  return avaliacao;
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
  return avaliacao;
}
