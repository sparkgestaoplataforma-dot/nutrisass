import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import {
  ListarUsuarios,
  ListarTodosNutricionistas,
  CriarUsuario,
  EditarUsuario,
  ExcluirUsuario,
  EsqueciSenha,
  AlterarSenha,
} from "./usuarios.service";
import { AppError } from "@/shared/middlewares/errorHandler";
import bcrypt from "bcryptjs";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe("usuarios.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockClinicaId = "clinica-1";
  const mockUsuarioId = "usuario-1";

  describe("ListarUsuarios", () => {
    it("deve retornar uma lista de usuários da clínica", async () => {
      prismaMock.usuario.findMany.mockResolvedValue([
        { id: mockUsuarioId, nome: "João", email: "joao@example.com" },
      ] as any);

      const result = await ListarUsuarios(mockClinicaId);

      expect(prismaMock.usuario.findMany).toHaveBeenCalledWith({
        where: { clinicaId: mockClinicaId },
        select: expect.any(Object),
        orderBy: { nome: "asc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("ListarTodosNutricionistas", () => {
    it("deve retornar apenas usuários com perfil NUTRICIONISTA", async () => {
      prismaMock.usuario.findMany.mockResolvedValue([
        { id: "nutri-1", nome: "Maria", perfil: "NUTRICIONISTA" },
      ] as any);

      const result = await ListarTodosNutricionistas(mockClinicaId);

      expect(prismaMock.usuario.findMany).toHaveBeenCalledWith({
        where: {
          clinicaId: mockClinicaId,
          perfil: "NUTRICIONISTA",
        },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("CriarUsuario", () => {
    it("deve criar um novo usuário com sucesso", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      prismaMock.usuario.create.mockResolvedValue({
        id: "novo-id",
        nome: "Novo",
        email: "novo@example.com",
      } as any);

      const data = { nome: "Novo", email: "novo@example.com", senha: "123", perfil: "NUTRICIONISTA" };
      const result = await CriarUsuario(mockClinicaId, data);

      expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({ where: { email: data.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith("123", 10);
      expect(prismaMock.usuario.create).toHaveBeenCalled();
      expect(result.id).toBe("novo-id");
    });

    it("deve lançar erro se o e-mail já existir", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({ id: "existente" } as any);

      const data = { nome: "Novo", email: "existente@example.com", senha: "123", perfil: "NUTRICIONISTA" };
      
      await expect(CriarUsuario(mockClinicaId, data)).rejects.toThrow(new AppError("E-mail já cadastrado", 409));
    });
  });

  describe("EditarUsuario", () => {
    it("deve atualizar um usuário existente", async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({ id: mockUsuarioId, clinicaId: mockClinicaId } as any);
      prismaMock.usuario.update.mockResolvedValue({ id: mockUsuarioId, nome: "Atualizado" } as any);

      const result = await EditarUsuario(mockUsuarioId, mockClinicaId, { nome: "Atualizado" });

      expect(prismaMock.usuario.update).toHaveBeenCalled();
      expect(result.nome).toBe("Atualizado");
    });

    it("deve atualizar a senha se fornecida", async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({ id: mockUsuarioId, clinicaId: mockClinicaId } as any);
      prismaMock.usuario.update.mockResolvedValue({ id: mockUsuarioId } as any);

      await EditarUsuario(mockUsuarioId, mockClinicaId, { senha: "nova-senha" });

      expect(bcrypt.hash).toHaveBeenCalledWith("nova-senha", 10);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ senha: "hashed_password" })
        })
      );
    });

    it("deve lançar erro se o usuário não for encontrado", async () => {
      prismaMock.usuario.findFirst.mockResolvedValue(null);

      await expect(EditarUsuario(mockUsuarioId, mockClinicaId, {})).rejects.toThrow(new AppError("Usuário não encontrado", 404));
    });
  });

  describe("ExcluirUsuario", () => {
    it("deve excluir o usuário com sucesso", async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({ id: mockUsuarioId, perfil: "NUTRICIONISTA" } as any);
      prismaMock.usuario.delete.mockResolvedValue({} as any);

      const result = await ExcluirUsuario(mockUsuarioId, mockClinicaId);

      expect(prismaMock.usuario.delete).toHaveBeenCalledWith({ where: { id: mockUsuarioId } });
      expect(result.message).toBe("Usuário excluído");
    });

    it("deve impedir a exclusão do último ADMIN", async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({ id: mockUsuarioId, perfil: "ADMIN" } as any);
      prismaMock.usuario.count.mockResolvedValue(1); // Só tem ele

      await expect(ExcluirUsuario(mockUsuarioId, mockClinicaId)).rejects.toThrow(new AppError("Não é possível excluir o último administrador", 400));
    });
  });

  describe("EsqueciSenha", () => {
    it("deve retornar sucesso se o e-mail existir", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({ id: mockUsuarioId } as any);

      const result = await EsqueciSenha("teste@example.com");

      expect(result.found).toBe(true);
    });

    it("deve lançar erro se o e-mail não existir", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);

      await expect(EsqueciSenha("naoexiste@example.com")).rejects.toThrow(new AppError("Email não encontrado", 404));
    });
  });

  describe("AlterarSenha", () => {
    it("deve alterar a senha com sucesso", async () => {
      prismaMock.usuario.update.mockResolvedValue({ id: mockUsuarioId } as any);

      const result = await AlterarSenha("teste@example.com", "nova-senha");

      expect(bcrypt.hash).toHaveBeenCalledWith("nova-senha", 10);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { email: "teste@example.com" },
        data: { senha: "hashed_password" }
      });
      expect(result.senhaAtualizada).toBe(true);
    });
  });
});
