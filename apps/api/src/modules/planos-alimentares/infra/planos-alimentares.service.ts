import { prisma } from "@/shared/providers/prisma";
import { AppError } from "@/shared/middlewares/errorHandler";
import { CreatePlanoAlimentarInput, UpdatePlanoAlimentarInput } from "@nutricao/shared";

export async function criarPlanoAlimentar(
  clinicaId: string,
  usuarioId: string,
  data: CreatePlanoAlimentarInput
) {
  const { 
    pacienteId, isTemplate, titulo, objetivo, 
    metaCalorias, metaProteinas, metaCarboidratos, metaGorduras, 
    recomendacaoAguaMl, observacoes, refeicoes 
  } = data;

  if (!isTemplate) {
    const paciente = pacienteId
      ? await prisma.paciente.findFirst({
          where: { id: pacienteId, clinicaId },
        })
      : null;

    if (!paciente) {
      throw new AppError("Paciente não encontrado nesta clínica", 404);
    }
  }

  const plano = await prisma.planoAlimentar.create({
    data: {
      clinicaId,
      usuarioId,
      pacienteId: isTemplate ? null : (pacienteId ?? null),
      ...(isTemplate ? { isTemplate: true } : {}),
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
                  alimentoId: alimento.alimentoId,
                  medidaCaseiraId: alimento.medidaCaseiraId,
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
              alimentos: {
                include: {
                  alimentoRel: {
                    include: { medidasCaseiras: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return plano;
}

export async function pegarPlanosAlimentares(
  clinicaId: string,
  pacienteId?: string,
  isTemplate?: boolean,
) {
  const where: any = { clinicaId };
  if (pacienteId) {
    where.pacienteId = pacienteId;
  }
  if (isTemplate !== undefined) {
    where.isTemplate = isTemplate;
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
              alimentos: {
                include: {
                  alimentoRel: {
                    include: { medidasCaseiras: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function pegarPlanoAlimentarPorId(id: string, clinicaId: string) {
  const plano = await prisma.planoAlimentar.findFirst({
    where: { id, clinicaId },
    include: {
      clinica: { select: { nome: true, logomarca: true } },
      usuario: { select: { nome: true, email: true, crn: true } },
      paciente: { select: { id: true, nome: true, dataNascimento: true } },
      refeicoes: {
        orderBy: { ordem: "asc" },
        include: {
          opcoes: {
            orderBy: { ordem: "asc" },
            include: {
              alimentos: {
                include: {
                  alimentoRel: {
                    include: { medidasCaseiras: true },
                  },
                },
              },
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

export async function editarPlanoAlimentar(
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
                  alimentoId: alimento.alimentoId,
                  medidaCaseiraId: alimento.medidaCaseiraId,
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
                alimentos: {
                  include: {
                    alimentoRel: {
                      include: { medidasCaseiras: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return planoAtualizado;
  });
}

export async function excluirPlanoAlimentar(id: string, clinicaId: string) {
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

