import { describe, it, expect, vi, beforeEach } from "vitest";
import { criarPergunta, editarModulo, excluirModulo, editarPergunta, excluirPergunta } from "./modulos.service";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import * as questionariosService from "../../questionarios/infra/questionarios.service";
import { AppError } from "@/shared/middlewares/errorHandler";

vi.mock("../../questionarios/infra/questionarios.service", () => ({
  resolverQuestionarioParaMutacaoEstrutural: vi.fn().mockResolvedValue({ questionarioId: "q-1", versionado: false }),
}));

describe("modulos.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockClinicaId = "clinica-1";
  const mockModuloId = "modulo-1";
  const mockPerguntaId = "pergunta-1";

  describe("criarPergunta", () => {
    it("deve criar uma pergunta com sucesso", async () => {
      prismaMock.modulo.findFirst.mockResolvedValue({ id: mockModuloId, questionarioId: "q-1", ordem: 1 } as any);
      
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          pergunta: {
            updateMany: vi.fn().mockResolvedValue({}),
            create: vi.fn().mockResolvedValue({ id: "nova-pergunta" }),
          }
        });
      });

      const result = await criarPergunta(mockClinicaId, mockModuloId, { descricao: "Teste", ordem: 1 });

      expect(prismaMock.modulo.findFirst).toHaveBeenCalled();
      expect(questionariosService.resolverQuestionarioParaMutacaoEstrutural).toHaveBeenCalled();
      expect(result.id).toBe("nova-pergunta");
    });

    it("deve lançar erro se o modulo nao existir", async () => {
      prismaMock.modulo.findFirst.mockResolvedValue(null);
      await expect(criarPergunta(mockClinicaId, mockModuloId, { descricao: "x", ordem: 1 })).rejects.toThrow(AppError);
    });
  });

  describe("editarModulo", () => {
    it("deve editar o módulo", async () => {
      prismaMock.modulo.findFirst.mockResolvedValue({ id: mockModuloId, questionarioId: "q-1", ordem: 1 } as any);
      prismaMock.modulo.count.mockResolvedValue(1);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          modulo: {
            updateMany: vi.fn().mockResolvedValue({}),
            update: vi.fn().mockResolvedValue({ id: mockModuloId, nome: "Novo" }),
          }
        });
      });

      const result = await editarModulo(mockClinicaId, mockModuloId, { nome: "Novo" });
      expect(result.nome).toBe("Novo");
    });
  });

  describe("excluirModulo", () => {
    it("deve excluir o módulo", async () => {
      prismaMock.modulo.findFirst.mockResolvedValue({ id: mockModuloId, questionarioId: "q-1", ordem: 1 } as any);
      
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          modulo: {
            delete: vi.fn().mockResolvedValue({}),
            updateMany: vi.fn().mockResolvedValue({}),
          }
        });
      });

      await excluirModulo(mockClinicaId, mockModuloId);
      expect(prismaMock.modulo.findFirst).toHaveBeenCalled();
    });
  });

  describe("editarPergunta", () => {
    it("deve editar a pergunta", async () => {
      prismaMock.pergunta.findFirst.mockResolvedValue({ id: mockPerguntaId, moduloId: mockModuloId, ordem: 1 } as any);
      prismaMock.pergunta.count.mockResolvedValue(1);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          pergunta: {
            updateMany: vi.fn().mockResolvedValue({}),
            update: vi.fn().mockResolvedValue({ id: mockPerguntaId, descricao: "Novo" }),
          }
        });
      });

      const result = await editarPergunta(mockClinicaId, mockModuloId, mockPerguntaId, { descricao: "Novo" });
      expect(result.descricao).toBe("Novo");
    });
  });

  describe("excluirPergunta", () => {
    it("deve excluir a pergunta", async () => {
      prismaMock.pergunta.findFirst.mockResolvedValue({ id: mockPerguntaId, moduloId: mockModuloId, ordem: 1, modulo: { questionarioId: "q-1", ordem: 1 } } as any);
      
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          pergunta: {
            delete: vi.fn().mockResolvedValue({}),
            updateMany: vi.fn().mockResolvedValue({}),
          }
        });
      });

      await excluirPergunta(mockClinicaId, mockModuloId, mockPerguntaId);
      expect(prismaMock.pergunta.findFirst).toHaveBeenCalled();
    });
  });
});
