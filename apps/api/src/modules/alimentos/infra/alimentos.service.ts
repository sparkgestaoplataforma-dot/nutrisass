import { prisma } from "../../../shared/providers/prisma.js";
import { AppError } from "../../../shared/middlewares/errorHandler.js";
import { AlimentoInput } from "@nutricao/shared";

export async function pegarAlimentos(clinicaId: string, q?: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  const where: any = {
    OR: [
      { clinicaId: null }, // Alimentos Globais (TACO)
      { clinicaId: clinicaId }, // Alimentos customizados da clínica
    ],
  };

  if (q) {
    where.nome = { contains: q, mode: "insensitive" };
  }

  const [total, alimentos] = await Promise.all([
    prisma.alimento.count({ where }),
    prisma.alimento.findMany({
      where,
      include: {
        medidasCaseiras: true,
      },
      orderBy: [
        { clinicaId: "desc" }, // Prioriza listar os da clínica primeiro se houver
        { nome: "asc" },
      ],
      skip,
      take: limit,
    }),
  ]);

  return {
    data: alimentos,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function criarAlimento(clinicaId: string, data: AlimentoInput) {
  const { medidasCaseiras, ...alimentoData } = data;

  const alimento = await prisma.alimento.create({
    data: {
      ...alimentoData,
      clinicaId, // Sempre vincula à clínica, apenas o seed cria alimentos globais
      medidasCaseiras: medidasCaseiras ? {
        create: medidasCaseiras.map(m => ({
          nome: m.nome,
          quantidadeEmGramas: m.quantidadeEmGramas,
        }))
      } : undefined,
    },
    include: {
      medidasCaseiras: true,
    },
  });

  return alimento;
}

export async function pegarAlimentoPorId(id: string, clinicaId: string) {
  const alimento = await prisma.alimento.findFirst({
    where: {
      id,
      OR: [
        { clinicaId: null },
        { clinicaId: clinicaId },
      ],
    },
    include: {
      medidasCaseiras: true,
    },
  });

  if (!alimento) {
    throw new AppError("Alimento não encontrado", 404);
  }

  return alimento;
}
