import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createPlanoAlimentarSchema,
  updatePlanoAlimentarSchema,
} from "@nutricao/shared";
import * as controller from "./planos-alimentares.controller";
import * as service from "./planos-alimentares.service";

vi.mock("./planos-alimentares.service");

const PACIENTE_UUID = "11111111-1111-4111-8111-111111111111";

describe("planos-alimentares.controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: {
        clinicaId: "clinica-1",
        userId: "usuario-1",
        perfil: "NUTRICIONISTA",
        tipoClinica: "CLINICA",
      } as any,
      query: {},
      params: {},
      body: {},
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("criar", () => {
    it("deve criar um plano alimentar e retornar 201", async () => {
      req.body = { titulo: "Plano 1" };
      vi.mocked(service.criarPlanoAlimentar).mockResolvedValue({ id: "1", titulo: "Plano 1" } as any);

      await controller.criar(req as Request, res as Response);

      expect(service.criarPlanoAlimentar).toHaveBeenCalledWith("clinica-1", "usuario-1", req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "1", titulo: "Plano 1" } });
    });
  });

  describe("listar", () => {
    it("deve listar os planos da clínica com isTemplate=false por padrão", async () => {
      vi.mocked(service.pegarPlanosAlimentares).mockResolvedValue([{ id: "1" }] as any);

      await controller.listar(req as Request, res as Response);

      expect(service.pegarPlanosAlimentares).toHaveBeenCalledWith("clinica-1", undefined, false);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: "1" }] });
    });

    it("deve passar pacienteId válido e isTemplate=false quando isTemplate não é informado", async () => {
      req.query = { pacienteId: PACIENTE_UUID };
      vi.mocked(service.pegarPlanosAlimentares).mockResolvedValue([] as any);

      await controller.listar(req as Request, res as Response);

      expect(service.pegarPlanosAlimentares).toHaveBeenCalledWith("clinica-1", PACIENTE_UUID, false);
    });

    it("deve passar isTemplate=true se fornecido na query", async () => {
      req.query = { isTemplate: "true" };
      vi.mocked(service.pegarPlanosAlimentares).mockResolvedValue([] as any);

      await controller.listar(req as Request, res as Response);

      expect(service.pegarPlanosAlimentares).toHaveBeenCalledWith("clinica-1", undefined, true);
    });

    it("deve rejeitar pacienteId inválido, isTemplate inválido, parâmetros repetidos e combinação pacienteId+isTemplate=true", async () => {
      const invalidQueries: Array<Record<string, unknown>> = [
        { pacienteId: "nao-e-uuid" },
        { isTemplate: "1" },
        { isTemplate: "TRUE" },
        { isTemplate: "" },
        { isTemplate: ["true", "false"] },
        { pacienteId: [PACIENTE_UUID, PACIENTE_UUID] },
        { pacienteId: PACIENTE_UUID, isTemplate: "true" },
        { extraParam: "foo" },
      ];

      for (const query of invalidQueries) {
        req.query = query as any;
        await expect(controller.listar(req as Request, res as Response)).rejects.toThrow(ZodError);
      }
    });
  });

  describe("contratos create/updatePlanoAlimentarSchema (SEC-02)", () => {
    it("deve aceitar modelo com isTemplate=true e pacienteId=null ou omitido", () => {
      expect(
        createPlanoAlimentarSchema.safeParse({
          isTemplate: true,
          pacienteId: null,
          titulo: "Modelo 1800",
          refeicoes: [],
        }).success,
      ).toBe(true);

      expect(
        createPlanoAlimentarSchema.safeParse({
          isTemplate: true,
          titulo: "Modelo 1800",
          refeicoes: [],
        }).success,
      ).toBe(true);
    });

    it("deve rejeitar payloads inconsistentes entre isTemplate e pacienteId", () => {
      expect(
        createPlanoAlimentarSchema.safeParse({
          isTemplate: true,
          pacienteId: PACIENTE_UUID,
          titulo: "Inconsistente",
          refeicoes: [],
        }).success,
      ).toBe(false);

      expect(
        createPlanoAlimentarSchema.safeParse({
          isTemplate: false,
          pacienteId: null,
          titulo: "Sem paciente",
          refeicoes: [],
        }).success,
      ).toBe(false);

      expect(
        createPlanoAlimentarSchema.safeParse({
          titulo: "Sem paciente e sem isTemplate",
          refeicoes: [],
        }).success,
      ).toBe(false);
    });

    it("updatePlanoAlimentarSchema não deve permitir alterar pacienteId ou isTemplate", () => {
      const parsed = updatePlanoAlimentarSchema.parse({
        titulo: "Atualizado",
        pacienteId: PACIENTE_UUID,
        isTemplate: true,
      } as any);

      expect(parsed).toEqual({ titulo: "Atualizado" });
      expect("pacienteId" in parsed).toBe(false);
      expect("isTemplate" in parsed).toBe(false);
    });
  });

  describe("buscarPorId", () => {
    it("deve buscar por ID e retornar o plano", async () => {
      req.params = { id: "plano-1" };
      vi.mocked(service.pegarPlanoAlimentarPorId).mockResolvedValue({ id: "plano-1" } as any);

      await controller.buscarPorId(req as any, res as Response);

      expect(service.pegarPlanoAlimentarPorId).toHaveBeenCalledWith("plano-1", "clinica-1");
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "plano-1" } });
    });
  });

  describe("editar", () => {
    it("deve editar o plano e retornar", async () => {
      req.params = { id: "plano-1" };
      req.body = { titulo: "Plano Atualizado" };
      vi.mocked(service.editarPlanoAlimentar).mockResolvedValue({ id: "plano-1", titulo: "Plano Atualizado" } as any);

      await controller.editar(req as any, res as Response);

      expect(service.editarPlanoAlimentar).toHaveBeenCalledWith("plano-1", "clinica-1", req.body);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "plano-1", titulo: "Plano Atualizado" } });
    });
  });

  describe("excluir", () => {
    it("deve excluir o plano passando o ator autenticado e retornar sucesso", async () => {
      req.params = { id: "plano-1" };
      vi.mocked(service.excluirPlanoAlimentar).mockResolvedValue({ success: true });

      await controller.excluir(req as any, res as Response);

      expect(service.excluirPlanoAlimentar).toHaveBeenCalledWith("plano-1", "clinica-1", {
        usuarioId: "usuario-1",
        perfil: "NUTRICIONISTA",
        tipoClinica: "CLINICA",
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Plano alimentar excluído com sucesso" });
    });
  });
});
