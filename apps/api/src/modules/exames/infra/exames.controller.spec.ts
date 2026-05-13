import { describe, it, expect, vi, beforeEach } from "vitest";
import { listarExamesBase, criarExameBase, editarExameBase, excluirExameBase, listarSolicitacoes, solicitarExame, registrarResultado, excluirSolicitacao } from "./exames.controller";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import { AppError } from "@/shared/middlewares/errorHandler";

describe("exames.controller", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      body: {},
      query: {},
      params: { pacienteId: "paciente-1", id: "exame-1" },
      user: { clinicaId: "clinica-1" }
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("Exames Base", () => {
    it("deve listar exames base", async () => {
      prismaMock.exameBase.findMany.mockResolvedValue([{ id: "ex-1" }] as any);
      await listarExamesBase(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: "ex-1" }] }));
    });

    it("deve criar exame base customizado", async () => {
      prismaMock.exameBase.findFirst.mockResolvedValue(null);
      prismaMock.exameBase.create.mockResolvedValue({ id: "ex-new" } as any);
      await criarExameBase(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("não deve permitir editar exame base padrao do sistema", async () => {
      prismaMock.exameBase.findFirst.mockResolvedValue({ id: "exame-1", isBase: true } as any);
      await expect(editarExameBase(mockReq, mockRes)).rejects.toThrow(AppError);
    });

    it("não deve permitir excluir exame base padrao do sistema", async () => {
      prismaMock.exameBase.findFirst.mockResolvedValue({ id: "exame-1", isBase: true } as any);
      await expect(excluirExameBase(mockReq, mockRes)).rejects.toThrow(AppError);
    });
  });

  describe("Solicitações", () => {
    it("deve listar solicitações", async () => {
      prismaMock.solicitacaoExame.findMany.mockResolvedValue([{ id: "sol-1" }] as any);
      await listarSolicitacoes(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("deve solicitar exames", async () => {
      mockReq.body.exameBaseIds = ["ex-1"];
      prismaMock.paciente.findUnique.mockResolvedValue({ id: "paciente-1" } as any);
      prismaMock.solicitacaoExame.create.mockResolvedValue({ id: "sol-new" } as any);
      await solicitarExame(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("deve registrar resultado", async () => {
      mockReq.body = { itemId: "item-1", dataResultado: "2026-05-12", resultado: "OK" };
      prismaMock.solicitacaoExameItem.findUnique.mockResolvedValue({ id: "item-1" } as any);
      prismaMock.solicitacaoExameItem.update.mockResolvedValue({ id: "item-1", resultado: "OK" } as any);
      await registrarResultado(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("deve excluir solicitação", async () => {
      prismaMock.solicitacaoExame.findUnique.mockResolvedValue({ id: "sol-1" } as any);
      prismaMock.solicitacaoExame.delete.mockResolvedValue({} as any);
      await excluirSolicitacao(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
