import { describe, it, expect, vi, beforeEach } from "vitest";
import { listarEvolucoes, criarEvolucao, editarEvolucao, listarMedidas, criarMedida, excluirMedida } from "./prontuario.controller";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import { AppError } from "@/shared/middlewares/errorHandler";

describe("prontuario.controller", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      body: {},
      params: { pacienteId: "paciente-1", id: "item-1" },
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("Evolução Clínica", () => {
    it("deve listar evoluções", async () => {
      prismaMock.evolucaoClinica.findMany.mockResolvedValue([{ id: "ev-1" }] as any);
      await listarEvolucoes(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: "ev-1" }] }));
    });

    it("deve criar evolução", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({ id: "paciente-1" } as any);
      prismaMock.evolucaoClinica.create.mockResolvedValue({ id: "ev-new" } as any);
      await criarEvolucao(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("deve editar evolução", async () => {
      prismaMock.evolucaoClinica.findUnique.mockResolvedValue({ id: "item-1" } as any);
      prismaMock.evolucaoClinica.update.mockResolvedValue({ id: "item-1", texto: "Novo texto" } as any);
      await editarEvolucao(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe("Medidas", () => {
    it("deve listar medidas", async () => {
      prismaMock.medida.findMany.mockResolvedValue([{ id: "med-1" }] as any);
      await listarMedidas(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("deve criar medida", async () => {
      mockReq.body.data = "2026-05-12T10:00:00Z";
      prismaMock.paciente.findUnique.mockResolvedValue({ id: "paciente-1" } as any);
      prismaMock.medida.create.mockResolvedValue({ id: "med-new" } as any);
      await criarMedida(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("deve excluir medida", async () => {
      prismaMock.medida.findUnique.mockResolvedValue({ id: "item-1" } as any);
      prismaMock.medida.delete.mockResolvedValue({} as any);
      await excluirMedida(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
