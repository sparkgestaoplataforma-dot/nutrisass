import { prisma } from "@/shared/providers/prisma";
import { AppError } from "@/shared/middlewares/errorHandler.js";

export async function pegarAvaliacaoPorId(questionarioId: string) {
  const avaliacao = await prisma.avaliacao.findFirst({
    where: { questionarioId },
  });

  if (!avaliacao) {
    throw new AppError("Avaliação não encontrada", 404);
  }

  const regrasInterpretacao = await prisma.regraInterpretacao.findMany({
    where: {
      questionarioId: avaliacao.questionarioId,
    },
    orderBy: { pontuacaoMin: "asc" },
  });

  return {
    ...avaliacao,
    regrasInterpretacao,
  };
}
