import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNotificacoesUsuario, limparNotificacoes, enviarNotificacaoIndividual, enviarNotificacaoClinica } from "./notificacoes.controller";
import * as notificacoesService from "./notificacoes.service";
import * as socketProvider from "@/shared/providers/socket";
import * as redisProvider from "@/shared/providers/redis";
import { SOCKET_EVENTS } from "@nutricao/shared";
import type { Notificacao } from "@nutricao/shared";

vi.mock("./notificacoes.service", () => ({
  listarNotificacoesUsuario: vi.fn(),
  limparNotificacoesUsuario: vi.fn(),
}));

vi.mock("@/shared/providers/socket", () => ({
  getIO: vi.fn(),
}));

vi.mock("@/shared/providers/redis", () => ({
  redisSet: vi.fn(),
  redisLPush: vi.fn(),
}));

describe("notificacoes.controller", () => {
  let mockReq: { user?: { userId: string; clinicaId: string } };
  let mockRes: { json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> };
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      user: { userId: "user-1", clinicaId: "clinica-1" }
    };

    mockRes = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    mockEmit = vi.fn();
    mockTo = vi.fn().mockReturnValue({ emit: mockEmit });

    vi.mocked(socketProvider.getIO).mockReturnValue({
      to: mockTo
    } as unknown as ReturnType<typeof socketProvider.getIO>);
  });

  describe("getNotificacoesUsuario", () => {
    it("deve retornar as notificacoes do usuario logado", async () => {
      const mockNotificacoes: Notificacao[] = [
        { id: "1", tipo: "AGENDAMENTO", titulo: "Notificação 1", mensagem: "Msg 1", createdAt: "2026-01-01T00:00:00Z" },
        { id: "2", tipo: "SISTEMA", titulo: "Notificação 2", mensagem: "Msg 2", createdAt: "2026-01-01T00:00:00Z" },
      ];

      vi.mocked(notificacoesService.listarNotificacoesUsuario).mockResolvedValue(mockNotificacoes);

      await getNotificacoesUsuario(mockReq as never, mockRes as never);

      expect(notificacoesService.listarNotificacoesUsuario).toHaveBeenCalledWith("user-1");
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotificacoes
      });
    });

    it("deve lançar erro se usuário não estiver autenticado", async () => {
      mockReq.user = undefined;

      await expect(getNotificacoesUsuario(mockReq as never, mockRes as never)).rejects.toThrow("Usuário não autenticado");
    });
  });

  describe("limparNotificacoes", () => {
    it("deve limpar as notificacoes e emitir evento via socket", async () => {
      vi.mocked(notificacoesService.limparNotificacoesUsuario).mockResolvedValue(true);

      await limparNotificacoes(mockReq as never, mockRes as never);

      expect(notificacoesService.limparNotificacoesUsuario).toHaveBeenCalledWith("user-1");
      expect(socketProvider.getIO).toHaveBeenCalled();
      expect(mockTo).toHaveBeenCalledWith("usuario:user-1");
      expect(mockEmit).toHaveBeenCalledWith(SOCKET_EVENTS.NOTIFICACOES_LIMPAR);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Notificações removidas com sucesso"
      });
    });

    it("deve lançar erro ao limpar se usuário não estiver autenticado", async () => {
      mockReq.user = undefined;

      await expect(limparNotificacoes(mockReq as never, mockRes as never)).rejects.toThrow("Usuário não autenticado");
    });
  });

  describe("enviarNotificacaoIndividual", () => {
    const mockNotificacao: Notificacao = {
      id: "notif-1",
      tipo: "AGENDAMENTO",
      titulo: "Novo agendamento",
      mensagem: "Agendamento marcado",
      agendamentoId: "agend-1",
      createdAt: "2026-01-01T00:00:00Z"
    };

    it("deve enviar para ambos quando userId !== nutricionistaId", async () => {
      await enviarNotificacaoIndividual("notif-1", "user-1", "nutri-1", mockNotificacao);

      expect(redisProvider.redisSet).toHaveBeenCalledWith("notificacao:notif-1", JSON.stringify(mockNotificacao));
      expect(mockTo).toHaveBeenCalledWith("usuario:user-1");
      expect(mockTo).toHaveBeenCalledWith("usuario:nutri-1");
      expect(mockEmit).toHaveBeenCalledWith(SOCKET_EVENTS.AGENDA_NOVO, mockNotificacao);
      expect(redisProvider.redisLPush).toHaveBeenCalledWith("usuario:user-1:notificacoes", "notif-1");
      expect(redisProvider.redisLPush).toHaveBeenCalledWith("usuario:nutri-1:notificacoes", "notif-1");
    });

    it("deve enviar apenas para o próprio quando userId === nutricionistaId", async () => {
      await enviarNotificacaoIndividual("notif-1", "user-1", "user-1", mockNotificacao);

      expect(mockTo).toHaveBeenCalledWith("usuario:user-1");
      expect(mockTo).toHaveBeenCalledTimes(1);
      expect(redisProvider.redisLPush).toHaveBeenCalledTimes(1);
    });
  });

  describe("enviarNotificacaoClinica", () => {
    const mockNotificacao: Notificacao = {
      id: "notif-c1",
      tipo: "SISTEMA",
      titulo: "Aviso da clínica",
      mensagem: "Mensagem para todos",
      createdAt: "2026-01-01T00:00:00Z"
    };

    it("deve persistir no Redis e emitir para a room da clínica", async () => {
      await enviarNotificacaoClinica("notif-c1", "clinica-1", mockNotificacao);

      expect(redisProvider.redisSet).toHaveBeenCalledWith("notificacao:notif-c1", JSON.stringify(mockNotificacao));
      expect(redisProvider.redisLPush).toHaveBeenCalledWith("clinica:clinica-1:notificacoes", "notif-c1");
      expect(mockTo).toHaveBeenCalledWith("clinica:clinica-1");
      expect(mockEmit).toHaveBeenCalledWith(SOCKET_EVENTS.AGENDA_NOVO, mockNotificacao);
    });
  });
});
