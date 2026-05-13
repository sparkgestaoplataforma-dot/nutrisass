import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import {
  pegarAlimentos,
  criarAlimento,
  pegarAlimentoPorId,
} from "./alimentos.service";
import { AppError } from "@/shared/middlewares/errorHandler.js";

describe("alimentos.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockClinicaId = "clinica-1";
  const mockAlimentoId = "alimento-1";

  describe("pegarAlimentos", () => {
    it("deve retornar uma lista de alimentos globais e da clinica", async () => {
      prismaMock.alimento.count.mockResolvedValue(1);
      prismaMock.alimento.findMany.mockResolvedValue([
        { id: mockAlimentoId, nome: "Arroz", clinicaId: null }
      ] as any);

      const result = await pegarAlimentos(mockClinicaId);

      expect(prismaMock.alimento.count).toHaveBeenCalledWith({
        where: {
          OR: [{ clinicaId: null }, { clinicaId: mockClinicaId }],
        },
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("deve buscar alimentos com filtro 'q'", async () => {
      prismaMock.alimento.count.mockResolvedValue(1);
      prismaMock.alimento.findMany.mockResolvedValue([
        { id: mockAlimentoId, nome: "Feijão" }
      ] as any);

      await pegarAlimentos(mockClinicaId, "feijão");

      expect(prismaMock.alimento.count).toHaveBeenCalledWith({
        where: {
          OR: [{ clinicaId: null }, { clinicaId: mockClinicaId }],
          nome: { contains: "feijão", mode: "insensitive" },
        },
      });
    });
  });

  describe("criarAlimento", () => {
    it("deve criar um alimento vinculado à clínica", async () => {
      const payload = {
        nome: "Whey Protein",
        calorias: 120,
        medidasCaseiras: [
          { nome: "Scoop", quantidadeEmGramas: 30 }
        ]
      };

      prismaMock.alimento.create.mockResolvedValue({
        id: "novo-alimento",
        ...payload,
        clinicaId: mockClinicaId
      } as any);

      const result = await criarAlimento(mockClinicaId, payload);

      expect(prismaMock.alimento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nome: "Whey Protein",
            clinicaId: mockClinicaId,
            medidasCaseiras: {
              create: [
                { nome: "Scoop", quantidadeEmGramas: 30 }
              ]
            }
          })
        })
      );
      expect(result.id).toBe("novo-alimento");
      expect(result.clinicaId).toBe(mockClinicaId);
    });
  });

  describe("pegarAlimentoPorId", () => {
    it("deve retornar um erro 404 se o alimento não existir ou não pertencer à clínica/global", async () => {
      prismaMock.alimento.findFirst.mockResolvedValue(null);

      await expect(
        pegarAlimentoPorId(mockAlimentoId, mockClinicaId)
      ).rejects.toThrow(new AppError("Alimento não encontrado", 404));
    });

    it("deve buscar um alimento com sucesso", async () => {
      prismaMock.alimento.findFirst.mockResolvedValue({
        id: mockAlimentoId,
        nome: "Arroz"
      } as any);

      const result = await pegarAlimentoPorId(mockAlimentoId, mockClinicaId);

      expect(prismaMock.alimento.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockAlimentoId,
          OR: [
            { clinicaId: null },
            { clinicaId: mockClinicaId }
          ]
        },
        include: { medidasCaseiras: true }
      });
      expect(result.id).toBe(mockAlimentoId);
    });
  });
});
