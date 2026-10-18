import { describe, it, expect, vi, beforeEach } from "vitest";
import { gerarRelatorio } from "./relatorios.controller";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";

describe("relatorios.controller", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      query: { dataInicio: "2026-05-01", dataFim: "2026-05-31" },
      user: { clinicaId: "clinica-1" }
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("gerarRelatorio", () => {
    it("deve gerar o relatorio corretamente", async () => {
      prismaMock.agendamento.findMany.mockResolvedValue([
        { id: "ag-1", status: "REALIZADO" },
        { id: "ag-2", status: "CANCELADO" },
      ] as any);

      await gerarRelatorio(mockReq, mockRes);

      expect(prismaMock.agendamento.findMany).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          resumo: {
            total: 2,
            realizados: 1,
            cancelados: 1,
          }
        })
      }));
    });
  });
});
