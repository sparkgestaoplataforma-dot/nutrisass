import { describe, it, expect } from "vitest";
import {
  formatarDataBrasilia,
  formatarParaInputDateTime,
  formatarDataNascimento,
  TIMEZONE_BRASILIA,
} from "./date";

describe("date utils (apps/web/src/utils/date.ts)", () => {
  describe("constante TIMEZONE_BRASILIA", () => {
    it("deve ser America/Sao_Paulo", () => {
      expect(TIMEZONE_BRASILIA).toBe("America/Sao_Paulo");
    });
  });

  describe("formatarDataBrasilia", () => {
    it("deve retornar '-' para valores nulos, vazios ou indefinidos", () => {
      expect(formatarDataBrasilia(null)).toBe("-");
      expect(formatarDataBrasilia(undefined)).toBe("-");
      expect(formatarDataBrasilia("")).toBe("-");
    });

    it("deve retornar 'Data inválida' para datas com parsing inválido", () => {
      expect(formatarDataBrasilia("data-invalida")).toBe("Data inválida");
      expect(formatarDataBrasilia(new Date("invalida"))).toBe("Data inválida");
    });

    it("deve formatar data UTC aplicando o fuso de Brasília (UTC-3)", () => {
      // 15 de outubro de 2026 às 15:30:00 UTC -> 12:30:00 no Brasil
      const res = formatarDataBrasilia("2026-10-15T15:30:00.000Z");
      expect(res).toMatch(/15\/10\/2026,? 12:30:00/);
    });

    it("deve ajustar o dia quando o horário UTC cruzar a meia-noite", () => {
      // 15 de outubro de 2026 às 02:00:00 UTC -> 14 de outubro às 23:00:00 no Brasil
      const res = formatarDataBrasilia("2026-10-15T02:00:00.000Z");
      expect(res).toMatch(/14\/10\/2026,? 23:00:00/);
    });

    it("deve aceitar objeto Date como entrada", () => {
      const d = new Date("2026-10-15T15:30:00.000Z");
      const res = formatarDataBrasilia(d);
      expect(res).toMatch(/15\/10\/2026,? 12:30:00/);
    });
  });

  describe("formatarParaInputDateTime", () => {
    it("deve retornar string vazia para valores nulos, vazios ou inválidos", () => {
      expect(formatarParaInputDateTime(null)).toBe("");
      expect(formatarParaInputDateTime(undefined)).toBe("");
      expect(formatarParaInputDateTime("")).toBe("");
      expect(formatarParaInputDateTime("invalido")).toBe("");
    });

    it("deve formatar para o padrão HTML5 YYYY-MM-DDTHH:mm no fuso de Brasília", () => {
      // 15/10/2026 às 15:30:00 UTC -> 15/10/2026 às 12:30 no Brasil
      expect(formatarParaInputDateTime("2026-10-15T15:30:00.000Z")).toBe("2026-10-15T12:30");
    });

    it("deve formatar corretamente horários próximos ou na meia-noite", () => {
      // 15/10/2026 às 03:00:00 UTC -> 15/10/2026 às 00:00 no Brasil
      expect(formatarParaInputDateTime("2026-10-15T03:00:00.000Z")).toBe("2026-10-15T00:00");

      // 15/10/2026 às 02:59:00 UTC -> 14/10/2026 às 23:59 no Brasil
      expect(formatarParaInputDateTime("2026-10-15T02:59:00.000Z")).toBe("2026-10-14T23:59");
    });

    it("deve aceitar objeto Date como entrada", () => {
      const d = new Date("2026-10-15T15:30:00.000Z");
      expect(formatarParaInputDateTime(d)).toBe("2026-10-15T12:30");
    });
  });

  describe("formatarDataNascimento", () => {
    it("deve retornar 'Não informada' para valores nulos, indefinidos, vazios ou marcadores", () => {
      expect(formatarDataNascimento(null)).toBe("Não informada");
      expect(formatarDataNascimento(undefined)).toBe("Não informada");
      expect(formatarDataNascimento("")).toBe("Não informada");
      expect(formatarDataNascimento("   ")).toBe("Não informada");
      expect(formatarDataNascimento("-")).toBe("Não informada");
      expect(formatarDataNascimento("Não informada")).toBe("Não informada");
    });

    it("deve preservar o dia civil sem aplicar deslocamento de fuso em strings ISO UTC", () => {
      // 11 de julho de 1995 às 00:00:00 UTC NÃO pode virar 10 de julho
      expect(formatarDataNascimento("1995-07-11T00:00:00.000Z")).toBe("11/07/1995");
      expect(formatarDataNascimento("1995-07-11")).toBe("11/07/1995");
    });

    it("deve aceitar datas já no formato brasileiro DD/MM/YYYY", () => {
      expect(formatarDataNascimento("11/07/1995")).toBe("11/07/1995");
      expect(formatarDataNascimento("11/07/1995 00:00:00")).toBe("11/07/1995");
    });

    it("deve formatar objetos Date válidos utilizando a data UTC", () => {
      const d = new Date(Date.UTC(1995, 6, 11));
      expect(formatarDataNascimento(d)).toBe("11/07/1995");
    });

    it("deve retornar 'Não informada' para strings inválidas", () => {
      expect(formatarDataNascimento("data_invalida")).toBe("Não informada");
    });
  });
});
