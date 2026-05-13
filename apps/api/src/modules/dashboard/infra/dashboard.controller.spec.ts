import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboard } from "./dashboard.controller";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";

describe("dashboard.controller", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      user: { clinicaId: "clinica-1" }
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
  });
});
