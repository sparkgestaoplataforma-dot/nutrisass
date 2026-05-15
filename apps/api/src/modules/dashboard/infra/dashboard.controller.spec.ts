import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboard } from "./dashboard.controller";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";

describe("dashboard.controller", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      user: { clinicaId: "550e8400-e29b-41d4-a716-446655440000" },
      params: { nutricionistaId: "550e8400-e29b-41d4-a716-446655440001" },
      query: {}
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("getDashboard", () => {
    it("deve retornar os dados do dashboard", async () => {
      prismaMock.paciente.count.mockResolvedValue(10);
      prismaMock.agendamento.count.mockResolvedValue(5);
      prismaMock.agendamento.findMany.mockResolvedValue([] as any);

      await getDashboard(mockReq, mockRes);

      expect(prismaMock.paciente.count).toHaveBeenCalledTimes(2);
      expect(prismaMock.agendamento.count).toHaveBeenCalledTimes(5);
      expect(prismaMock.agendamento.findMany).toHaveBeenCalled();
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          totalPacientes: 10,
          agendaHoje: 5,
        })
      }));
    });

    it("deve permitir SECRETARIA visualizar dashboard da clínica toda", async () => {
      mockReq.user.perfil = "SECRETARIA";
      delete mockReq.params.nutricionistaId; // Sem nutricionistaId

      prismaMock.paciente.count.mockResolvedValue(100);
      prismaMock.agendamento.count.mockResolvedValue(20);
      prismaMock.agendamento.findMany.mockResolvedValue([] as any);

      await getDashboard(mockReq, mockRes);

      expect(prismaMock.agendamento.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.not.objectContaining({
          nutricionistaId: expect.any(String)
        })
      }));

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          totalPacientes: 100
        })
      }));
    });
  });
});
