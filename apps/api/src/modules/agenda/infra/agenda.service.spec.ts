import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import {
  pegarAgendamentosDia,
  criarAgendamento,
  editarAgendamento,
  alterarStatusAgendamento,
  excluirAgendamento,
} from "./agenda.service";
import { AppError } from "@/shared/middlewares/errorHandler";
import * as notificacaoService from "../../notificacao/infra/notificacao.service";

vi.mock("../../notificacao/infra/notificacao.service", () => ({
  criarNotificacao: vi.fn().mockResolvedValue({}),
}));

describe("agenda.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockClinicaId = "clinica-1";
  const mockUsuarioId = "usuario-1";
  const mockPacienteId = "paciente-1";
  const mockAgendamentoId = "agendamento-1";

  describe("pegarAgendamentosDia", () => {
    it("deve retornar a agenda do dia", async () => {
      prismaMock.agendamento.findMany.mockResolvedValue([
        { id: mockAgendamentoId, dataHora: new Date() },
      ] as any);

      const result = await pegarAgendamentosDia("2026-05-12", mockClinicaId, mockUsuarioId);

      expect(prismaMock.agendamento.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe("criarAgendamento", () => {
    it("deve criar um agendamento", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({ id: mockPacienteId, nome: "João" } as any);
      prismaMock.usuario.findUnique.mockResolvedValue({ id: mockUsuarioId, nome: "Dr. João" } as any);
      prismaMock.agendamento.create.mockResolvedValue({ id: "novo" } as any);

      const result = await criarAgendamento(
        { pacienteId: mockPacienteId, nutricionistaId: mockUsuarioId, dataHora: "2026-05-12T10:00:00Z" } as any,
        mockUsuarioId,
        mockClinicaId
      );

      expect(prismaMock.agendamento.create).toHaveBeenCalled();
      expect(notificacaoService.criarNotificacao).toHaveBeenCalled();
      expect(result.id).toBe("novo");
    });
  });

  describe("editarAgendamento", () => {
    it("deve editar um agendamento existente", async () => {
      prismaMock.agendamento.findUnique.mockResolvedValue({ id: mockAgendamentoId } as any);
      prismaMock.agendamento.update.mockResolvedValue({ id: mockAgendamentoId } as any);

      const result = await editarAgendamento(mockAgendamentoId, { observacao: "teste" });

      expect(prismaMock.agendamento.update).toHaveBeenCalled();
      expect(result.id).toBe(mockAgendamentoId);
    });
  });

  describe("alterarStatusAgendamento", () => {
    it("deve alterar o status", async () => {
      prismaMock.agendamento.findUnique.mockResolvedValue({ id: mockAgendamentoId, status: "AGENDADO", paciente: { nome: "Teste" } } as any);
      prismaMock.agendamento.update.mockResolvedValue({ id: mockAgendamentoId, status: "PRESENTE", clinicaId: mockClinicaId, usuarioId: mockUsuarioId, dataHora: new Date(), paciente: { nome: "Teste" } } as any);

      const result = await alterarStatusAgendamento(mockAgendamentoId, { status: "PRESENTE" });

      expect(prismaMock.agendamento.update).toHaveBeenCalled();
      expect(notificacaoService.criarNotificacao).toHaveBeenCalled();
      expect(result.status).toBe("PRESENTE");
    });
  });

  describe("excluirAgendamento", () => {
    it("deve excluir o agendamento", async () => {
      prismaMock.agendamento.findUnique.mockResolvedValue({ id: mockAgendamentoId } as any);
      prismaMock.agendamento.delete.mockResolvedValue({} as any);

      await excluirAgendamento(mockAgendamentoId);

      expect(prismaMock.agendamento.delete).toHaveBeenCalled();
    });
  });
});
