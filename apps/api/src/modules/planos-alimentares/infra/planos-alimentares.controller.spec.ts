import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import * as controller from "./planos-alimentares.controller";
import * as service from "./planos-alimentares.service";

vi.mock("./planos-alimentares.service");

describe("planos-alimentares.controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { clinicaId: "clinica-1", userId: "usuario-1" } as any,
      query: {},
      params: {},
      body: {},
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("criar", () => {
    it("deve criar um plano alimentar e retornar 201", async () => {
      req.body = { titulo: "Plano 1" };
      vi.mocked(service.criarPlanoAlimentar).mockResolvedValue({ id: "1", titulo: "Plano 1" } as any);

      await controller.criar(req as Request, res as Response);

      expect(service.criarPlanoAlimentar).toHaveBeenCalledWith("clinica-1", "usuario-1", req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "1", titulo: "Plano 1" } });
    });
  });

  describe("listar", () => {
    it("deve listar os planos da clínica", async () => {
      vi.mocked(service.pegarPlanosAlimentares).mockResolvedValue([{ id: "1" }] as any);

      await controller.listar(req as Request, res as Response);

      expect(service.pegarPlanosAlimentares).toHaveBeenCalledWith("clinica-1", undefined);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: "1" }] });
    });

    it("deve passar pacienteId se fornecido na query", async () => {
      req.query = { pacienteId: "paciente-1" };
      vi.mocked(service.pegarPlanosAlimentares).mockResolvedValue([] as any);

      await controller.listar(req as Request, res as Response);

      expect(service.pegarPlanosAlimentares).toHaveBeenCalledWith("clinica-1", "paciente-1");
    });

    it("deve passar isTemplate=true se fornecido na query", async () => {
      req.query = { isTemplate: "true" };
      vi.mocked(service.pegarPlanosAlimentares).mockResolvedValue([] as any);

      await controller.listar(req as Request, res as Response);

      expect(service.pegarPlanosAlimentares).toHaveBeenCalledWith("clinica-1", undefined, true);
    });
  });

  describe("buscarPorId", () => {
    it("deve buscar por ID e retornar o plano", async () => {
      req.params = { id: "plano-1" };
      vi.mocked(service.pegarPlanoAlimentarPorId).mockResolvedValue({ id: "plano-1" } as any);

      await controller.buscarPorId(req as any, res as Response);

      expect(service.pegarPlanoAlimentarPorId).toHaveBeenCalledWith("plano-1", "clinica-1");
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "plano-1" } });
    });
  });

  describe("editar", () => {
    it("deve editar o plano e retornar", async () => {
      req.params = { id: "plano-1" };
      req.body = { titulo: "Plano Atualizado" };
      vi.mocked(service.editarPlanoAlimentar).mockResolvedValue({ id: "plano-1", titulo: "Plano Atualizado" } as any);

      await controller.editar(req as any, res as Response);

      expect(service.editarPlanoAlimentar).toHaveBeenCalledWith("plano-1", "clinica-1", req.body);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "plano-1", titulo: "Plano Atualizado" } });
    });
  });

  describe("excluir", () => {
    it("deve excluir o plano e retornar sucesso", async () => {
      req.params = { id: "plano-1" };
      vi.mocked(service.excluirPlanoAlimentar).mockResolvedValue({ success: true });

      await controller.excluir(req as any, res as Response);

      expect(service.excluirPlanoAlimentar).toHaveBeenCalledWith("plano-1", "clinica-1");
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Plano alimentar excluído com sucesso" });
    });
  });
});
