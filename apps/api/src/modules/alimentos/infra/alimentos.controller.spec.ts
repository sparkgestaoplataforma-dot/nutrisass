import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import * as controller from "./alimentos.controller";
import * as service from "./alimentos.service";

vi.mock("./alimentos.service");

describe("alimentos.controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { clinicaId: "clinica-1" } as any,
      query: {},
      params: {},
      body: {},
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("listar", () => {
    it("deve listar os alimentos e retornar na resposta", async () => {
      const mockResult = { data: [], total: 0, page: 1, totalPages: 0 };
      vi.mocked(service.listar).mockResolvedValue(mockResult as any);

      await controller.listar(req as Request, res as Response);

      expect(service.listar).toHaveBeenCalledWith("clinica-1", undefined, 1, 20);
      expect(res.json).toHaveBeenCalledWith({ success: true, ...mockResult });
    });

    it("deve passar parâmetros de query para o service", async () => {
      req.query = { q: "arroz", page: "2", limit: "10" };
      vi.mocked(service.listar).mockResolvedValue({} as any);

      await controller.listar(req as Request, res as Response);

      expect(service.listar).toHaveBeenCalledWith("clinica-1", "arroz", 2, 10);
    });
  });

  describe("criar", () => {
    it("deve criar um alimento e retornar com status 201", async () => {
      req.body = { nome: "Frango" };
      vi.mocked(service.criar).mockResolvedValue({ id: "1", nome: "Frango" } as any);

      await controller.criar(req as Request, res as Response);

      expect(service.criar).toHaveBeenCalledWith("clinica-1", req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "1", nome: "Frango" } });
    });
  });

  describe("buscarPorId", () => {
    it("deve buscar o alimento por ID e retornar", async () => {
      req.params = { id: "alimento-1" };
      vi.mocked(service.buscarPorId).mockResolvedValue({ id: "alimento-1" } as any);

      await controller.buscarPorId(req as any, res as Response);

      expect(service.buscarPorId).toHaveBeenCalledWith("alimento-1", "clinica-1");
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "alimento-1" } });
    });
  });
});
