import { describe, it, expect, vi, beforeEach } from "vitest";
import { getClinica, atualizarClinica, onboarding } from "./clinica.controller";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppError } from "@/shared/middlewares/errorHandler";

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mocked-token"),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  },
}));

describe("clinica.controller", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      body: {},
      headers: {},
      user: { userId: "user-1", clinicaId: "clinica-1" }
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("getClinica", () => {
    it("deve retornar os dados da clinica", async () => {
      prismaMock.clinica.findUnique.mockResolvedValue({ id: "clinica-1", nome: "Teste" } as any);

      await getClinica(mockReq, mockRes);

      expect(prismaMock.clinica.findUnique).toHaveBeenCalledWith({ where: { id: "clinica-1" } });
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { id: "clinica-1", nome: "Teste" } });
    });
  });

  describe("atualizarClinica", () => {
    it("deve atualizar os dados da clinica", async () => {
      mockReq.body = { nome: "Novo Nome" };
      prismaMock.clinica.update.mockResolvedValue({ id: "clinica-1", nome: "Novo Nome" } as any);

      await atualizarClinica(mockReq, mockRes);

      expect(prismaMock.clinica.update).toHaveBeenCalledWith({ where: { id: "clinica-1" }, data: { nome: "Novo Nome" } });
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { id: "clinica-1", nome: "Novo Nome" } });
    });
  });

  describe("onboarding", () => {
    it("deve realizar o onboarding de nova clinica e usuario", async () => {
      mockReq.body = {
        clinica: { nome: "Clinica X" },
        admin: { nome: "Admin", email: "admin@x.com", senha: "123" }
      };

      prismaMock.usuario.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          clinica: { create: vi.fn().mockResolvedValue({ id: "new-clinica" }) },
          usuario: { create: vi.fn().mockResolvedValue({ id: "new-admin", email: "admin@x.com" }) },
          convenio: { create: vi.fn() },
        });
      });

      await onboarding(mockReq, mockRes);

      expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({ where: { email: "admin@x.com" } });
      expect(bcrypt.hash).toHaveBeenCalledWith("123", 10);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("deve falhar se email ja existir", async () => {
      mockReq.body = { admin: { email: "admin@x.com" } };
      prismaMock.usuario.findUnique.mockResolvedValue({ id: "existente" } as any);

      await expect(onboarding(mockReq, mockRes)).rejects.toThrow(new AppError('E-mail já cadastrado', 409));
    });
  });
});
