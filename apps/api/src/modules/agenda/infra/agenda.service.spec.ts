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


describe("agenda.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.agendamento.findFirst.mockResolvedValue(null);
  });

  const mockClinicaId = "550e8400-e29b-41d4-a716-446655440000";
  const mockUsuarioId = "550e8400-e29b-41d4-a716-446655440001";
  const mockPacienteId = "550e8400-e29b-41d4-a716-446655440002";
  const mockAgendamentoId = "550e8400-e29b-41d4-a716-446655440003";

  describe("pegarAgendamentosDia", () => {
    it("deve retornar a agenda do dia", async () => {
      prismaMock.agendamento.findMany.mockResolvedValue([
        { id: mockAgendamentoId, dataHora: new Date() },
      ] as any);

      const result = await pegarAgendamentosDia("2026-05-12", mockClinicaId, mockUsuarioId, mockUsuarioId);

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
        { pacienteId: mockPacienteId, criadoPorUsuarioId: mockUsuarioId, nutricionistaId: mockUsuarioId, dataHora: "2026-05-12T10:00:00Z" } as any,
        mockUsuarioId,
        mockClinicaId
      );

      expect(prismaMock.agendamento.create).toHaveBeenCalled();
      expect(result.id).toBe("novo");
    });

    it("deve lançar erro se houver conflito de horário e não for encaixe", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({ id: mockPacienteId, nome: "João" } as any);
      prismaMock.usuario.findUnique.mockResolvedValue({ id: mockUsuarioId, nome: "Dr. João" } as any);
      prismaMock.agendamento.findFirst.mockResolvedValue({ id: "existente" } as any);

      await expect(
        criarAgendamento(
          { pacienteId: mockPacienteId, criadoPorUsuarioId: mockUsuarioId, nutricionistaId: mockUsuarioId, dataHora: "2026-05-12T10:00:00Z", encaixe: false } as any,
          mockUsuarioId,
          mockClinicaId
        )
      ).rejects.toThrow(AppError);
    });

    it("deve permitir agendamento em horário ocupado se for encaixe", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({ id: mockPacienteId, nome: "João" } as any);
      prismaMock.usuario.findUnique.mockResolvedValue({ id: mockUsuarioId, nome: "Dr. João" } as any);
      prismaMock.agendamento.findFirst.mockResolvedValue({ id: "existente" } as any);
      prismaMock.agendamento.create.mockResolvedValue({ id: "novo_encaixe" } as any);

      const result = await criarAgendamento(
        { pacienteId: mockPacienteId, criadoPorUsuarioId: mockUsuarioId, nutricionistaId: mockUsuarioId, dataHora: "2026-05-12T10:00:00Z", encaixe: true } as any,
        mockUsuarioId,
        mockClinicaId
      );

      expect(prismaMock.agendamento.create).toHaveBeenCalled();
      expect(result.id).toBe("novo_encaixe");
    });
  });

  describe("editarAgendamento", () => {
    it("deve editar um agendamento existente", async () => {
      prismaMock.agendamento.findFirst.mockResolvedValueOnce({ id: mockAgendamentoId } as any);
      prismaMock.agendamento.findFirst.mockResolvedValueOnce(null);
      prismaMock.agendamento.update.mockResolvedValue({ id: mockAgendamentoId } as any);

      const result = await editarAgendamento(mockAgendamentoId, { observacao: "teste" }, mockClinicaId);

      expect(prismaMock.agendamento.update).toHaveBeenCalled();
      expect(result.id).toBe(mockAgendamentoId);
    });

    it("deve permitir alterar agendamento de encaixe para normal se não houver outro normal ativo", async () => {
      prismaMock.agendamento.findFirst.mockResolvedValueOnce({ 
        id: mockAgendamentoId, 
        encaixe: true, 
        dataHora: new Date("2026-05-12T13:00:00Z"),
        nutricionistaId: mockUsuarioId 
      } as any);
      // findFirst mock returning null indicates no active normal appointment conflicts
      prismaMock.agendamento.findFirst.mockResolvedValueOnce(null);
      prismaMock.agendamento.update.mockResolvedValue({ id: mockAgendamentoId, encaixe: false } as any);

      const result = await editarAgendamento(mockAgendamentoId, { encaixe: false }, mockClinicaId);
      expect(result.encaixe).toBe(false);
    });
  });

  describe("alterarStatusAgendamento", () => {
    it("deve alterar o status", async () => {
      prismaMock.agendamento.findFirst.mockResolvedValue({ id: mockAgendamentoId, status: "AGENDADO", paciente: { nome: "Teste" } } as any);
      prismaMock.agendamento.update.mockResolvedValue({ id: mockAgendamentoId, status: "PRESENTE", clinicaId: mockClinicaId, criadoPorUsuarioId: mockUsuarioId, dataHora: new Date(), paciente: { nome: "Teste" } } as any);

      const result = await alterarStatusAgendamento(mockAgendamentoId, { status: "PRESENTE" }, mockClinicaId);

      expect(prismaMock.agendamento.update).toHaveBeenCalled();
      expect(result.status).toBe("PRESENTE");
    });
  });

  describe("excluirAgendamento", () => {
    it("deve excluir o agendamento", async () => {
      prismaMock.agendamento.findFirst.mockResolvedValue({ id: mockAgendamentoId } as any);
      prismaMock.agendamento.delete.mockResolvedValue({} as any);

      await excluirAgendamento(mockAgendamentoId, mockClinicaId);

      expect(prismaMock.agendamento.delete).toHaveBeenCalled();
    });
  });
});
