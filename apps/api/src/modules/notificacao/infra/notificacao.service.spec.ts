import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import {
  buscarNotificacoesService,
  criarNotificacaoEEmitir,
  marcarComoLidaOuNaoLidaService,
  marcarTodasComoLidaService,
} from "./notificacao.service";
import { AppError } from "@/shared/middlewares/errorHandler";
import * as socketProvider from "@/shared/providers/socket";

vi.mock("@/shared/providers/socket", () => ({
  getIO: vi.fn().mockReturnValue({
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  }),
}));

describe("notificacao.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockClinicaId = "clinica-1";
  const mockUsuarioId = "usuario-1";
  const mockNotificacaoId = "notificacao-1";

  describe("buscarNotificacoesService", () => {
    it("deve retornar notificações do usuário", async () => {
      prismaMock.notificacao.findMany.mockResolvedValue([
        { id: mockNotificacaoId, titulo: "Teste" }
      ] as any);

      const result = await buscarNotificacoesService(mockClinicaId, mockUsuarioId);

      expect(prismaMock.notificacao.findMany).toHaveBeenCalledWith({
        where: { clinicaId: mockClinicaId, usuarioId: mockUsuarioId },
        orderBy: { createAt: 'desc' }
      });
      expect(result).toHaveLength(1);
    });

    it("deve lançar erro se o prisma falhar", async () => {
      prismaMock.notificacao.findMany.mockRejectedValue(new Error("DB Error"));
      await expect(buscarNotificacoesService(mockClinicaId, mockUsuarioId)).rejects.toThrow(new AppError("não foi possivel buscar por notificações", 500));
    });
  });

  describe("criarNotificacaoEEmitir", () => {
    it("deve criar e emitir notificação", async () => {
      prismaMock.notificacao.create.mockResolvedValue({ id: mockNotificacaoId, titulo: "Teste" } as any);

      const data = {
        clinicaId: mockClinicaId,
        usuarioId: mockUsuarioId,
        tipo: "SISTEMA" as const,
        titulo: "Teste"
      };

      const result = await criarNotificacaoEEmitir(data);

      expect(prismaMock.notificacao.create).toHaveBeenCalled();
      expect(socketProvider.getIO().to).toHaveBeenCalledWith(`user:${mockUsuarioId}`);
      expect(socketProvider.getIO().to(`user:${mockUsuarioId}`).emit).toHaveBeenCalledWith("notificacao:nova", expect.any(Object));
      expect(result.id).toBe(mockNotificacaoId);
    });
  });

  describe("marcarComoLidaOuNaoLidaService", () => {
    it("deve alternar o status de leitura da notificação", async () => {
      prismaMock.notificacao.findFirst.mockResolvedValue({ id: mockNotificacaoId, mensagemLida: false, titulo: "Teste" } as any);
      prismaMock.notificacao.update.mockResolvedValue({} as any);

      const result = await marcarComoLidaOuNaoLidaService(mockNotificacaoId);

      expect(prismaMock.notificacao.update).toHaveBeenCalledWith({
        where: { id: mockNotificacaoId },
        data: { mensagemLida: true }
      });
      expect(result).toContain("marcada como lida");
    });

    it("deve lançar erro se notificação não for encontrada", async () => {
      prismaMock.notificacao.findFirst.mockResolvedValue(null);
      await expect(marcarComoLidaOuNaoLidaService(mockNotificacaoId)).rejects.toThrow(new AppError("notificação não encontrada", 404));
    });
  });

  describe("marcarTodasComoLidaService", () => {
    it("deve marcar todas como lidas", async () => {
      prismaMock.notificacao.updateMany.mockResolvedValue({ count: 2 } as any);

      const result = await marcarTodasComoLidaService(mockClinicaId, mockUsuarioId);

      expect(prismaMock.notificacao.updateMany).toHaveBeenCalledWith({
        where: { clinicaId: mockClinicaId, usuarioId: mockUsuarioId, mensagemLida: false },
        data: { mensagemLida: true }
      });
      expect(result).toContain("sucesso");
    });
  });
});
