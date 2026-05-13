import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import { criarAvaliacaoPaciente, pegarNomePacientePorId, pegarAvaliacoesPaciente } from "./pacientes.service";
import { AppError } from "@/shared/middlewares/errorHandler";
import * as avaliacoesService from "../../avaliacoes/infra/avaliacoes.service";

vi.mock("../../avaliacoes/infra/avaliacoes.service", () => ({
  pegarAvaliacoesPorPacienteId: vi.fn().mockResolvedValue([]),
}));

describe("pacientes.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPacienteId = "paciente-1";
  const mockClinicaId = "clinica-1";
  const mockQuestionarioId = "questionario-1";

  describe("pegarNomePacientePorId", () => {
    it("deve retornar o nome do paciente", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({ nome: "João" } as any);

      const result = await pegarNomePacientePorId(mockPacienteId);

      expect(prismaMock.paciente.findUnique).toHaveBeenCalledWith({
        where: { id: mockPacienteId },
        select: { nome: true },
      });
      expect(result).toBe("João");
    });

    it("deve lançar erro se paciente não for encontrado", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue(null);

      await expect(pegarNomePacientePorId(mockPacienteId)).rejects.toThrow(new AppError("Paciente não encontrado", 404));
    });
  });

  describe("criarAvaliacaoPaciente", () => {
    it("deve criar uma avaliação com sucesso", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({ id: mockPacienteId, clinicaId: mockClinicaId } as any);
      prismaMock.questionario.findUnique.mockResolvedValue({ id: mockQuestionarioId, clinicaId: mockClinicaId, ativo: true } as any);
      prismaMock.avaliacao.create.mockResolvedValue({ id: "nova-avaliacao", scoreTotal: 10 } as any);

      const data = {
        respostas: [{ perguntaId: "p1", nota: 5 }, { perguntaId: "p2", nota: 5 }]
      };

      const result = await criarAvaliacaoPaciente(mockPacienteId, mockQuestionarioId, data);

      expect(prismaMock.avaliacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clinicaId: mockClinicaId,
            pacienteId: mockPacienteId,
            questionarioId: mockQuestionarioId,
            scoreTotal: 10,
          })
        })
      );
      expect(result.id).toBe("nova-avaliacao");
      expect(result.scoreTotal).toBe(10);
    });

    it("deve lançar erro se o paciente não for encontrado", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue(null);
      await expect(criarAvaliacaoPaciente(mockPacienteId, mockQuestionarioId, { respostas: [] })).rejects.toThrow(new AppError("Paciente não encontrado", 404));
    });

    it("deve lançar erro se o questionário não for encontrado", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({ id: mockPacienteId, clinicaId: mockClinicaId } as any);
      prismaMock.questionario.findUnique.mockResolvedValue(null);

      await expect(criarAvaliacaoPaciente(mockPacienteId, mockQuestionarioId, { respostas: [] })).rejects.toThrow(new AppError("Questionário não encontrado", 404));
    });

    it("deve lançar erro se o questionário estiver inativo", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({ id: mockPacienteId, clinicaId: mockClinicaId } as any);
      prismaMock.questionario.findUnique.mockResolvedValue({ id: mockQuestionarioId, clinicaId: mockClinicaId, ativo: false } as any);

      await expect(criarAvaliacaoPaciente(mockPacienteId, mockQuestionarioId, { respostas: [] })).rejects.toThrow(new AppError("Questionário inativo. Utilize a versão ativa mais recente", 400));
    });

    it("deve lançar erro se o paciente e questionário forem de clínicas diferentes", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({ id: mockPacienteId, clinicaId: mockClinicaId } as any);
      prismaMock.questionario.findUnique.mockResolvedValue({ id: mockQuestionarioId, clinicaId: "outra-clinica", ativo: true } as any);

      await expect(criarAvaliacaoPaciente(mockPacienteId, mockQuestionarioId, { respostas: [] })).rejects.toThrow(new AppError("Paciente e questionário não pertencem à mesma clínica", 400));
    });
  });

  describe("pegarAvaliacoesPaciente", () => {
    it("deve repassar a chamada para avaliacoesService", async () => {
      await pegarAvaliacoesPaciente(mockPacienteId, mockClinicaId, 1, 10);
      expect(avaliacoesService.pegarAvaliacoesPorPacienteId).toHaveBeenCalledWith(mockPacienteId, mockClinicaId, 1, 10);
    });
  });
});
