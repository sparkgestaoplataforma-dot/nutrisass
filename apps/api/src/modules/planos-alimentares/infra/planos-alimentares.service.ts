import { prisma } from "../../../shared/providers/prisma.js";
import { AppError } from "../../../shared/middlewares/errorHandler.js";
import { CreatePlanoAlimentarInput, UpdatePlanoAlimentarInput } from "@nutricao/shared";

export async function criar(
  clinicaId: string,
  usuarioId: string,
  data: CreatePlanoAlimentarInput
) {
  const { 
    pacienteId, titulo, objetivo, 
    metaCalorias, metaProteinas, metaCarboidratos, metaGorduras, 
    recomendacaoAguaMl, observacoes, refeicoes 
  } = data;

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, clinicaId },
  });

  if (!paciente) {
    throw new AppError("Paciente não encontrado nesta clínica", 404);
  }

  const plano = await prisma.planoAlimentar.create({
    data: {
      clinicaId,
      usuarioId,
      pacienteId,
      titulo,
      objetivo,
      metaCalorias,
      metaProteinas,
      metaCarboidratos,
      metaGorduras,
      recomendacaoAguaMl,
      observacoes,
      refeicoes: {
        create: refeicoes.map((refeicao) => ({
          nome: refeicao.nome,
          horario: refeicao.horario,
          ordem: refeicao.ordem,
          opcoes: {
            create: refeicao.opcoes.map((opcao) => ({
              nome: opcao.nome,
              ordem: opcao.ordem,
              alimentos: {
                create: opcao.alimentos.map((alimento) => ({
                  alimento: alimento.alimento,
                  quantidade: alimento.quantidade,
                  unidade: alimento.unidade,
                  calorias: alimento.calorias,
                  proteinas: alimento.proteinas,
                  carboidratos: alimento.carboidratos,
                  gorduras: alimento.gorduras,
                  observacao: alimento.observacao,
                })),
              },
            })),
          },
        })),
      },
    },
    include: {
      refeicoes: {
        orderBy: { ordem: "asc" },
        include: {
          opcoes: {
            orderBy: { ordem: "asc" },
            include: {
              alimentos: true,
            },
          },
        },
      },
    },
  });

  return plano;
}

export async function listar(clinicaId: string, pacienteId?: string) {
  const where: any = { clinicaId };
  if (pacienteId) {
    where.pacienteId = pacienteId;
  }

  return prisma.planoAlimentar.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: {
      paciente: { select: { nome: true } },
      refeicoes: {
        orderBy: { ordem: "asc" },
        include: {
          opcoes: {
            orderBy: { ordem: "asc" },
            include: {
              alimentos: true,
            },
          },
        },
      },
    },
  });
}

export async function buscarPorId(id: string, clinicaId: string) {
  const plano = await prisma.planoAlimentar.findFirst({
    where: { id, clinicaId },
    include: {
      paciente: { select: { id: true, nome: true } },
      refeicoes: {
        orderBy: { ordem: "asc" },
        include: {
          opcoes: {
            orderBy: { ordem: "asc" },
            include: {
              alimentos: true,
            },
          },
        },
      },
    },
  });

  if (!plano) {
    throw new AppError("Plano alimentar não encontrado", 404);
  }

  return plano;
}

export async function atualizar(
  id: string,
  clinicaId: string,
  data: UpdatePlanoAlimentarInput
) {
  const existente = await prisma.planoAlimentar.findFirst({
    where: { id, clinicaId },
  });

  if (!existente) {
    throw new AppError("Plano alimentar não encontrado", 404);
  }

  const { 
    titulo, objetivo, metaCalorias, metaProteinas, metaCarboidratos, 
    metaGorduras, recomendacaoAguaMl, observacoes, refeicoes 
  } = data;

  const updateData: any = {
    titulo,
    objetivo,
    metaCalorias,
    metaProteinas,
    metaCarboidratos,
    metaGorduras,
    recomendacaoAguaMl,
    observacoes,
  };

  return await prisma.$transaction(async (tx) => {
    if (refeicoes) {
      // Exclui as refeicoes existentes (em cascata as opcoes e alimentos)
      await tx.planoRefeicao.deleteMany({
        where: { planoAlimentarId: id },
      });

      updateData.refeicoes = {
        create: refeicoes.map((refeicao) => ({
          nome: refeicao.nome,
          horario: refeicao.horario,
          ordem: refeicao.ordem,
          opcoes: {
            create: refeicao.opcoes.map((opcao) => ({
              nome: opcao.nome,
              ordem: opcao.ordem,
              alimentos: {
                create: opcao.alimentos.map((alimento) => ({
                  alimento: alimento.alimento,
                  quantidade: alimento.quantidade,
                  unidade: alimento.unidade,
                  calorias: alimento.calorias,
                  proteinas: alimento.proteinas,
                  carboidratos: alimento.carboidratos,
                  gorduras: alimento.gorduras,
                  observacao: alimento.observacao,
                })),
              },
            })),
          },
        })),
      };
    }

    const planoAtualizado = await tx.planoAlimentar.update({
      where: { id },
      data: updateData,
      include: {
        refeicoes: {
          orderBy: { ordem: "asc" },
          include: {
            opcoes: {
              orderBy: { ordem: "asc" },
              include: {
                alimentos: true,
              },
            },
          },
        },
      },
    });

    return planoAtualizado;
  });
}

export async function deletar(id: string, clinicaId: string) {
  const existente = await prisma.planoAlimentar.findFirst({
    where: { id, clinicaId },
  });

  if (!existente) {
    throw new AppError("Plano alimentar não encontrado", 404);
  }

  await prisma.planoAlimentar.delete({
    where: { id },
  });

  return { success: true };
}

