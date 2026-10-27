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
    it("deve listar exames base com paginação e busca", async () => {
      mockReq.query = { page: "1", limit: "20", search: "glicemia" };
      prismaMock.exameBase.findMany.mockResolvedValue([{ id: "ex-1", nome: "Glicemia" }] as any);
      prismaMock.exameBase.count.mockResolvedValue(1);
      await listarExamesBase(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [{ id: "ex-1", nome: "Glicemia" }],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        })
      );
    });

    it("deve limitar a 100 itens no máximo", async () => {
      mockReq.query = { limit: "200" };
      prismaMock.exameBase.findMany.mockResolvedValue([]);
      prismaMock.exameBase.count.mockResolvedValue(0);
      await listarExamesBase(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        })
      );
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
      prismaMock.paciente.findFirst.mockResolvedValue({ id: "paciente-1" } as any);
      prismaMock.solicitacaoExame.findMany.mockResolvedValue([{ id: "sol-1" }] as any);
      await listarSolicitacoes(mockReq, mockRes);
      expect(prismaMock.paciente.findFirst).toHaveBeenCalledWith({ where: { id: "paciente-1", clinicaId: "clinica-1" } });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("não deve listar solicitações de paciente de outra clínica", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);
      await expect(listarSolicitacoes(mockReq, mockRes)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.solicitacaoExame.findMany).not.toHaveBeenCalled();
    });

    it("deve solicitar exames", async () => {
      mockReq.body.exameBaseIds = ["ex-1"];
      prismaMock.paciente.findFirst.mockResolvedValue({ id: "paciente-1" } as any);
      prismaMock.exameBase.count.mockResolvedValue(1);
      prismaMock.solicitacaoExame.create.mockResolvedValue({ id: "sol-new" } as any);
      await solicitarExame(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("não deve solicitar exames para paciente de outra clínica", async () => {
      mockReq.body.exameBaseIds = ["ex-1"];
      prismaMock.paciente.findFirst.mockResolvedValue(null);
      await expect(solicitarExame(mockReq, mockRes)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.solicitacaoExame.create).not.toHaveBeenCalled();
    });

    it("não deve solicitar exames base de outra clínica", async () => {
      mockReq.body.exameBaseIds = ["ex-1", "ex-outra-clinica"];
      prismaMock.paciente.findFirst.mockResolvedValue({ id: "paciente-1" } as any);
      prismaMock.exameBase.count.mockResolvedValue(1);
      await expect(solicitarExame(mockReq, mockRes)).rejects.toMatchObject({ statusCode: 400 });
      expect(prismaMock.solicitacaoExame.create).not.toHaveBeenCalled();
    });

    it("deve registrar resultado", async () => {
      mockReq.body = { itemId: "item-1", dataResultado: "2026-05-12", resultado: "OK" };
      prismaMock.solicitacaoExameItem.findFirst.mockResolvedValue({ id: "item-1" } as any);
      prismaMock.solicitacaoExameItem.update.mockResolvedValue({ id: "item-1", resultado: "OK" } as any);
      await registrarResultado(mockReq, mockRes);
      expect(prismaMock.solicitacaoExameItem.findFirst).toHaveBeenCalledWith({
        where: { id: "item-1", solicitacao: { paciente: { clinicaId: "clinica-1" } } },
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("não deve registrar resultado de item de outra clínica", async () => {
      mockReq.body = { itemId: "item-1", dataResultado: "2026-05-12", resultado: "OK" };
      prismaMock.solicitacaoExameItem.findFirst.mockResolvedValue(null);
      await expect(registrarResultado(mockReq, mockRes)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.solicitacaoExameItem.update).not.toHaveBeenCalled();
    });

    it("deve excluir solicitação", async () => {
      prismaMock.solicitacaoExame.findFirst.mockResolvedValue({ id: "sol-1" } as any);
      prismaMock.solicitacaoExame.delete.mockResolvedValue({} as any);
      await excluirSolicitacao(mockReq, mockRes);
      expect(prismaMock.solicitacaoExame.findFirst).toHaveBeenCalledWith({
        where: { id: "exame-1", paciente: { clinicaId: "clinica-1" } },
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("não deve excluir solicitação de outra clínica", async () => {
      prismaMock.solicitacaoExame.findFirst.mockResolvedValue(null);
      await expect(excluirSolicitacao(mockReq, mockRes)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.solicitacaoExame.delete).not.toHaveBeenCalled();
    });
  });
});
