import { CreateModuloPerguntaInput } from "@nutricao/shared";
import { AppError } from "../../../shared/middlewares/errorHandler.js";
import { prisma } from "../../../shared/providers/prisma.js";

export async function criarPergunta(
  clinicaId: string,
  moduloId: string,
  data: CreateModuloPerguntaInput,
) {
  const modulo = await prisma.modulo.findFirst({
    where: {
      id: moduloId,
      questionario: {
        clinicaId,
      },
    },
    select: { id: true },
  });

  if (!modulo) {
    throw new AppError("Módulo não encontrado para a clínica", 404);
  }

  const pergunta = await prisma.$transaction(async (tx) => {
    await tx.pergunta.updateMany({
      where: { moduloId, ordem: { gte: data.ordem } },
      data: { ordem: { increment: 1 } },
    });

    return tx.pergunta.create({
      data: {
        moduloId,
        descricao: data.descricao,
        ordem: data.ordem,
      },
    });
  });

  return pergunta;
}
