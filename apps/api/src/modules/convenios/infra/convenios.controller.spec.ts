import { describe, it, expect, vi, beforeEach } from "vitest";
import { listar, criar, editar, excluir } from "./convenios.controller";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import { AppError } from "@/shared/middlewares/errorHandler";

describe("convenios.controller", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      body: {},
      params: { id: "convenio-1" },
      user: { userId: "user-1", clinicaId: "clinica-1" }
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("listar", () => {
    it("deve retornar a lista de convênios com paginação", async () => {
      mockReq.query = { page: "1", limit: "10", search: "unimed" };
      prismaMock.convenio.findMany.mockResolvedValue([{ id: "convenio-1", nome: "Unimed" }] as any);
      prismaMock.convenio.count.mockResolvedValue(1);
      await listar(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [{ id: "convenio-1", nome: "Unimed" }],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        })
      );
    });

    it("deve respeitar limite máximo de 100 itens", async () => {
      mockReq.query = { page: "1", limit: "500" };
      prismaMock.convenio.findMany.mockResolvedValue([]);
      prismaMock.convenio.count.mockResolvedValue(0);
      await listar(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        })
      );
    });
  });

  describe("criar", () => {
    it("deve criar um convênio", async () => {
      mockReq.body = { nome: "Bradesco" };
      prismaMock.convenio.create.mockResolvedValue({ id: "new", nome: "Bradesco" } as any);
      await criar(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("editar", () => {
    it("deve editar um convênio existente", async () => {
      prismaMock.convenio.findFirst.mockResolvedValue({ id: "convenio-1" } as any);
      prismaMock.convenio.update.mockResolvedValue({ id: "convenio-1", nome: "Updated" } as any);
      await editar(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("deve dar erro se convênio não existir", async () => {
      prismaMock.convenio.findFirst.mockResolvedValue(null);
      await expect(editar(mockReq, mockRes)).rejects.toThrow(AppError);
    });
  });

  describe("excluir", () => {
    it("deve excluir o convênio", async () => {
      prismaMock.convenio.findFirst.mockResolvedValue({ id: "convenio-1" } as any);
      prismaMock.convenio.delete.mockResolvedValue({} as any);
      await excluir(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
