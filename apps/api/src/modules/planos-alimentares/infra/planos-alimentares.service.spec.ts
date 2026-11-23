import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import {
  criarPlanoAlimentar,
  pegarPlanosAlimentares,
  pegarPlanoAlimentarPorId,
  editarPlanoAlimentar,
  excluirPlanoAlimentar,
} from "./planos-alimentares.service";
import { AppError } from "@/shared/middlewares/errorHandler.js";

describe("planos-alimentares.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPayload = {
    pacienteId: "paciente-1",
    titulo: "Plano Teste",
    observacoes: "Obs teste",
    refeicoes: [
      {
        nome: "Café da Manhã",
        horario: "08:00",
        ordem: 1,
        opcoes: [
          {
            nome: "Opção 1",
            ordem: 1,
            alimentos: [
              {
                alimento: "Pão",
                quantidade: 2,
                unidade: "fatias",
                calorias: 150,
                proteinas: null,
                carboidratos: null,
                gorduras: null,
                observacao: "Sem casca",
              },
            ],
          },
        ],
      },
    ],
  };

  describe("criarPlanoAlimentar", () => {
    it("deve retornar erro 404 se o paciente não for encontrado na clínica", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);

      await expect(
        criarPlanoAlimentar("clinica-1", "usuario-1", mockPayload)
      ).rejects.toThrow(new AppError("Paciente não encontrado nesta clínica", 404));
    });

    it("deve criar o plano alimentar com sucesso e usar os dados corretamente", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({ id: "paciente-1" } as any);
      
      const mockPlanoCreated = { id: "plano-1", ...mockPayload };
      prismaMock.planoAlimentar.create.mockResolvedValue(mockPlanoCreated as any);

      const result = await criarPlanoAlimentar("clinica-1", "usuario-1", mockPayload);

      expect(prismaMock.planoAlimentar.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clinicaId: "clinica-1",
            usuarioId: "usuario-1",
            pacienteId: "paciente-1",
            titulo: "Plano Teste",
            refeicoes: expect.objectContaining({
              create: expect.any(Array),
            })
          })
        })
      );
      expect(result).toEqual(mockPlanoCreated);
    });
  });

  describe("pegarPlanosAlimentares", () => {
    it("deve listar os planos da clínica quando pacienteId não é informado", async () => {
      prismaMock.planoAlimentar.findMany.mockResolvedValue([{ id: "plano-1" }] as any);

      const result = await pegarPlanosAlimentares("clinica-1");

      expect(prismaMock.planoAlimentar.findMany).toHaveBeenCalledWith({
        where: { clinicaId: "clinica-1" },
        orderBy: { criadoEm: "desc" },
        include: expect.any(Object),
      });
      expect(result).toHaveLength(1);
    });

    it("deve listar os planos filtrados pelo pacienteId", async () => {
      prismaMock.planoAlimentar.findMany.mockResolvedValue([{ id: "plano-1" }] as any);

      await pegarPlanosAlimentares("clinica-1", "paciente-1");

      expect(prismaMock.planoAlimentar.findMany).toHaveBeenCalledWith({
        where: { clinicaId: "clinica-1", pacienteId: "paciente-1" },
        orderBy: { criadoEm: "desc" },
        include: expect.any(Object),
      });
    });
  });

  describe("pegarPlanoAlimentarPorId", () => {
    it("deve retornar erro 404 se o plano não existir na clínica informada", async () => {
      prismaMock.planoAlimentar.findFirst.mockResolvedValue(null);

      await expect(
        pegarPlanoAlimentarPorId("plano-1", "clinica-1")
      ).rejects.toThrow(new AppError("Plano alimentar não encontrado", 404));
    });

    it("deve buscar o plano com suas relações", async () => {
      prismaMock.planoAlimentar.findFirst.mockResolvedValue({ id: "plano-1" } as any);

      const result = await pegarPlanoAlimentarPorId("plano-1", "clinica-1");

      expect(prismaMock.planoAlimentar.findFirst).toHaveBeenCalledWith({
        where: { id: "plano-1", clinicaId: "clinica-1" },
        include: expect.objectContaining({
          usuario: { select: { nome: true, email: true, crn: true } },
        }),
      });
      expect(result.id).toBe("plano-1");
    });
  });

  describe("editarPlanoAlimentar", () => {
    it("deve retornar erro 404 se o plano não existir", async () => {
      prismaMock.planoAlimentar.findFirst.mockResolvedValue(null);

      await expect(
        editarPlanoAlimentar("plano-1", "clinica-1", mockPayload)
      ).rejects.toThrow(new AppError("Plano alimentar não encontrado", 404));
    });

    it("deve excluir as refeições e alimentos antigos e atualizar com sucesso", async () => {
      prismaMock.planoAlimentar.findFirst.mockResolvedValue({ id: "plano-1" } as any);
      
      // Mock the transaction to execute its callback with the prisma mock
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return await callback(prismaMock);
      });
      
      prismaMock.planoRefeicao.deleteMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.planoAlimentar.update.mockResolvedValue({ id: "plano-1", titulo: "Novo Titulo" } as any);

      const updatePayload = { ...mockPayload, titulo: "Novo Titulo" };
      const result = await editarPlanoAlimentar("plano-1", "clinica-1", updatePayload);

      expect(prismaMock.planoRefeicao.deleteMany).toHaveBeenCalledWith({
        where: { planoAlimentarId: "plano-1" },
      });

      expect(prismaMock.planoAlimentar.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "plano-1" },
          data: expect.objectContaining({
            titulo: "Novo Titulo",
            refeicoes: expect.objectContaining({
              create: expect.any(Array),
            }),
          }),
        })
      );
      expect(result.titulo).toBe("Novo Titulo");
    });
  });

  describe("excluirPlanoAlimentar", () => {
    it("deve retornar erro 404 se o plano não existir ao deletar", async () => {
      prismaMock.planoAlimentar.findFirst.mockResolvedValue(null);

      await expect(
        excluirPlanoAlimentar("plano-1", "clinica-1")
      ).rejects.toThrow(new AppError("Plano alimentar não encontrado", 404));
      expect(prismaMock.planoAlimentar.delete).not.toHaveBeenCalled();
    });

    it("deve deletar o plano com sucesso verificando clinicaId", async () => {
      prismaMock.planoAlimentar.findFirst.mockResolvedValue({ id: "plano-1" } as any);
      prismaMock.planoAlimentar.delete.mockResolvedValue({ id: "plano-1" } as any);

      const result = await excluirPlanoAlimentar("plano-1", "clinica-1");

      expect(prismaMock.planoAlimentar.delete).toHaveBeenCalledWith({
        where: { id: "plano-1" },
      });
      expect(result.success).toBe(true);
    });
  });
});
