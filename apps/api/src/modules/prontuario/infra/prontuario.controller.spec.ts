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
      user: { clinicaId: "clinica-1" },
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("Evolução Clínica", () => {
    it("deve listar evoluções", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({ id: "paciente-1" } as any);
      prismaMock.evolucaoClinica.findMany.mockResolvedValue([{ id: "ev-1" }] as any);
      await listarEvolucoes(mockReq, mockRes);
      expect(prismaMock.paciente.findFirst).toHaveBeenCalledWith({ where: { id: "paciente-1", clinicaId: "clinica-1" } });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: "ev-1" }] }));
    });

    it("não deve listar evoluções de paciente de outra clínica", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);
      await expect(listarEvolucoes(mockReq, mockRes)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.evolucaoClinica.findMany).not.toHaveBeenCalled();
    });

    it("deve criar evolução", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({ id: "paciente-1" } as any);
      prismaMock.evolucaoClinica.create.mockResolvedValue({ id: "ev-new" } as any);
      await criarEvolucao(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("não deve criar evolução para paciente de outra clínica", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);
      await expect(criarEvolucao(mockReq, mockRes)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.evolucaoClinica.create).not.toHaveBeenCalled();
    });

    it("deve editar evolução", async () => {
      prismaMock.evolucaoClinica.findFirst.mockResolvedValue({ id: "item-1" } as any);
      prismaMock.evolucaoClinica.update.mockResolvedValue({ id: "item-1", texto: "Novo texto" } as any);
      await editarEvolucao(mockReq, mockRes);
      expect(prismaMock.evolucaoClinica.findFirst).toHaveBeenCalledWith({
        where: { id: "item-1", paciente: { clinicaId: "clinica-1" } },
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("não deve editar evolução de outra clínica", async () => {
      prismaMock.evolucaoClinica.findFirst.mockResolvedValue(null);
      await expect(editarEvolucao(mockReq, mockRes)).rejects.toBeInstanceOf(AppError);
      expect(prismaMock.evolucaoClinica.update).not.toHaveBeenCalled();
    });
  });

  describe("Medidas", () => {
    it("deve listar medidas", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({ id: "paciente-1" } as any);
      prismaMock.medida.findMany.mockResolvedValue([{ id: "med-1" }] as any);
      await listarMedidas(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("não deve listar medidas de paciente de outra clínica", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);
      await expect(listarMedidas(mockReq, mockRes)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.medida.findMany).not.toHaveBeenCalled();
    });

    it("deve criar medida", async () => {
      mockReq.body.data = "2026-05-12T10:00:00Z";
      prismaMock.paciente.findFirst.mockResolvedValue({ id: "paciente-1" } as any);
      prismaMock.medida.create.mockResolvedValue({ id: "med-new" } as any);
      await criarMedida(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("não deve criar medida para paciente de outra clínica", async () => {
      mockReq.body.data = "2026-05-12T10:00:00Z";
      prismaMock.paciente.findFirst.mockResolvedValue(null);
      await expect(criarMedida(mockReq, mockRes)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.medida.create).not.toHaveBeenCalled();
    });

    it("deve excluir medida", async () => {
      prismaMock.medida.findFirst.mockResolvedValue({ id: "item-1" } as any);
      prismaMock.medida.delete.mockResolvedValue({} as any);
      await excluirMedida(mockReq, mockRes);
      expect(prismaMock.medida.findFirst).toHaveBeenCalledWith({
        where: { id: "item-1", paciente: { clinicaId: "clinica-1" } },
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("não deve excluir medida de outra clínica", async () => {
      prismaMock.medida.findFirst.mockResolvedValue(null);
      await expect(excluirMedida(mockReq, mockRes)).rejects.toBeInstanceOf(AppError);
      expect(prismaMock.medida.delete).not.toHaveBeenCalled();
    });
  });
});
