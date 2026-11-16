import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import "express-async-errors";
import express from "express";
import jwt from "jsonwebtoken";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { env } from "@/config/env";
import { errorHandler } from "@/shared/middlewares/errorHandler";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import { prontuarioRoutes } from "@/modules/prontuario/infra/prontuario.routes";
import { avaliacoesRoutes } from "@/modules/avaliacoes/infra/avaliacoes.routes";
import { planosAlimentaresRoutes } from "@/modules/planos-alimentares/infra/planos-alimentares.routes";
import { examesRoutes } from "@/modules/exames/infra/exames.routes";
import { pacientesRoutes } from "@/modules/pacientes/infra/pacientes.routes";
import { agendaRoutes } from "@/modules/agenda/infra/agenda.routes";
import { relatoriosRoutes } from "@/modules/relatorios/infra/relatorios.routes";
import { dashboardRoutes } from "@/modules/dashboard/infra/dashboard.routes";

// Evita conexão real com o Redis: nenhum token está na blacklist.
vi.mock("@/shared/providers/redis", () => ({
  redis: null,
  redisGet: vi.fn().mockResolvedValue(null),
  redisSet: vi.fn(),
  redisDel: vi.fn(),
  redisLPush: vi.fn(),
  redisLRange: vi.fn().mockResolvedValue([]),
  redisSAdd: vi.fn(),
  redisSMembers: vi.fn().mockResolvedValue([]),
  redisSIsMember: vi.fn().mockResolvedValue(0),
}));

const CLINICA_A = "11111111-1111-4111-8111-111111111111";
const CLINICA_B = "22222222-2222-4222-8222-222222222222";
const USER_ID = "33333333-3333-4333-8333-333333333333";
const PACIENTE_ID = "44444444-4444-4444-8444-444444444444";
const RECURSO_ID = "55555555-5555-4555-8555-555555555555";
const EXAME_BASE_ID = "66666666-6666-4666-8666-666666666666";
const QUESTIONARIO_ID = "77777777-7777-4777-8777-777777777777";
const PERGUNTA_ID = "88888888-8888-4888-8888-888888888888";

type Perfil = "ADMIN" | "SECRETARIA" | "NUTRICIONISTA";
type TipoClinica = "CLINICA" | "AUTONOMO";
type MockFn = ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Infraestrutura: app Express com os routers reais, JWT real e Prisma mockado
// ---------------------------------------------------------------------------
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/prontuario", prontuarioRoutes);
  app.use("/api/avaliacoes", avaliacoesRoutes);
  app.use("/api/planos-alimentares", planosAlimentaresRoutes);
  app.use("/api/exames", examesRoutes);
  app.use("/api/pacientes", pacientesRoutes);
  app.use("/api/agendamentos", agendaRoutes);
  app.use("/api/relatorios", relatoriosRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use(errorHandler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function tokenFor(
  perfil: Perfil,
  tipoClinica: TipoClinica = "CLINICA",
  clinicaId: string = CLINICA_A,
) {
  return jwt.sign(
    { userId: USER_ID, clinicaId, email: "teste@nutri.com", perfil, tipoClinica },
    env.JWT_SECRET,
  );
}

async function call(method: string, path: string, token?: string, body?: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, body: json as any };
}

// Procura o primeiro `clinicaId` em um filtro Prisma (inclusive em relações aninhadas).
function clinicaIdOf(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  if (typeof obj.clinicaId === "string") return obj.clinicaId;
  for (const nested of Object.values(obj)) {
    const found = clinicaIdOf(nested);
    if (found) return found;
  }
  return undefined;
}

// Simula um banco em que o registro pertence à CLINICA_A: só é devolvido se o filtro
// da consulta restringir pela clínica correta. Consultas sem filtro de clínica devolvem
// o registro (como o banco faria) e fazem os testes de isolamento falharem.
function ownedByClinicaA(record: unknown) {
  return async (args: any) =>
    (clinicaIdOf(args?.where) ?? CLINICA_A) === CLINICA_A ? record : null;
}

function mockOwned(fn: unknown, record: unknown) {
  (fn as MockFn).mockImplementation(ownedByClinicaA(record));
}

function mockValue(fn: unknown, value: unknown) {
  (fn as MockFn).mockResolvedValue(value);
}

// ---------------------------------------------------------------------------
// Matriz de endpoints clínicos protegidos pelo clinicalGuard
// ---------------------------------------------------------------------------
interface ClinicalEndpoint {
  name: string;
  method: string;
  path: string;
  body?: unknown;
  expectedStatus: number;
  /** Configura o Prisma mockado para o cenário de sucesso (dados da CLINICA_A). */
  arrange: () => void;
  /** Operação no banco que comprova o efeito (leitura, criação, edição ou exclusão). */
  effect: () => MockFn;
  /** Todas as chamadas ao banco que o handler faria (nada deve ocorrer quando negado). */
  dbCalls: () => MockFn[];
  /** Listagens sempre filtradas por clínica: devolvem 200 (vazio) para outra clínica. */
  scopedList?: boolean;
}

const db = prismaMock as any;

const clinicalEndpoints: ClinicalEndpoint[] = [
  // ----- Prontuário -----
  {
    name: "GET /prontuario/:pacienteId/evolucoes",
    method: "GET",
    path: `/api/prontuario/${PACIENTE_ID}/evolucoes`,
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.paciente.findFirst, { id: PACIENTE_ID });
      mockValue(db.evolucaoClinica.findMany, []);
    },
    effect: () => db.evolucaoClinica.findMany,
    dbCalls: () => [db.paciente.findFirst, db.evolucaoClinica.findMany],
  },
  {
    name: "POST /prontuario/:pacienteId/evolucoes",
    method: "POST",
    path: `/api/prontuario/${PACIENTE_ID}/evolucoes`,
    body: { pacienteId: PACIENTE_ID, estadoClinico: "Estável" },
    expectedStatus: 201,
    arrange: () => {
      mockOwned(db.paciente.findFirst, { id: PACIENTE_ID });
      mockValue(db.evolucaoClinica.create, { id: RECURSO_ID });
    },
    effect: () => db.evolucaoClinica.create,
    dbCalls: () => [db.paciente.findFirst, db.evolucaoClinica.create],
  },
  {
    name: "PUT /prontuario/evolucoes/:id",
    method: "PUT",
    path: `/api/prontuario/evolucoes/${RECURSO_ID}`,
    body: { estadoClinico: "Atualizado" },
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.evolucaoClinica.findFirst, { id: RECURSO_ID });
      mockValue(db.evolucaoClinica.update, { id: RECURSO_ID });
    },
    effect: () => db.evolucaoClinica.update,
    dbCalls: () => [db.evolucaoClinica.findFirst, db.evolucaoClinica.update],
  },
  {
    name: "DELETE /prontuario/evolucoes/:id",
    method: "DELETE",
    path: `/api/prontuario/evolucoes/${RECURSO_ID}`,
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.evolucaoClinica.findFirst, { id: RECURSO_ID });
      mockValue(db.evolucaoClinica.delete, {});
    },
    effect: () => db.evolucaoClinica.delete,
    dbCalls: () => [db.evolucaoClinica.findFirst, db.evolucaoClinica.delete],
  },
  {
    name: "GET /prontuario/:pacienteId/medidas",
    method: "GET",
    path: `/api/prontuario/${PACIENTE_ID}/medidas`,
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.paciente.findFirst, { id: PACIENTE_ID });
      mockValue(db.medida.findMany, []);
    },
    effect: () => db.medida.findMany,
    dbCalls: () => [db.paciente.findFirst, db.medida.findMany],
  },
  {
    name: "POST /prontuario/:pacienteId/medidas",
    method: "POST",
    path: `/api/prontuario/${PACIENTE_ID}/medidas`,
    body: { pacienteId: PACIENTE_ID, data: "2026-05-12", peso: 70 },
    expectedStatus: 201,
    arrange: () => {
      mockOwned(db.paciente.findFirst, { id: PACIENTE_ID });
      mockValue(db.medida.create, { id: RECURSO_ID });
    },
    effect: () => db.medida.create,
    dbCalls: () => [db.paciente.findFirst, db.medida.create],
  },
  {
    name: "PUT /prontuario/medidas/:id",
    method: "PUT",
    path: `/api/prontuario/medidas/${RECURSO_ID}`,
    body: { peso: 71.5 },
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.medida.findFirst, { id: RECURSO_ID });
      mockValue(db.medida.update, { id: RECURSO_ID });
    },
    effect: () => db.medida.update,
    dbCalls: () => [db.medida.findFirst, db.medida.update],
  },
  {
    name: "DELETE /prontuario/medidas/:id",
    method: "DELETE",
    path: `/api/prontuario/medidas/${RECURSO_ID}`,
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.medida.findFirst, { id: RECURSO_ID });
      mockValue(db.medida.delete, {});
    },
    effect: () => db.medida.delete,
    dbCalls: () => [db.medida.findFirst, db.medida.delete],
  },
  // ----- Avaliações -----
  {
    name: "GET /avaliacoes/:id",
    method: "GET",
    path: `/api/avaliacoes/${RECURSO_ID}`,
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.avaliacao.findFirst, {
        id: RECURSO_ID,
        scoreTotal: 10,
        questionario: { regras: [] },
      });
    },
    effect: () => db.avaliacao.findFirst,
    dbCalls: () => [db.avaliacao.findFirst],
  },
  {
    name: "GET /avaliacoes/:id/questionario",
    method: "GET",
    path: `/api/avaliacoes/${RECURSO_ID}/questionario`,
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.avaliacao.findFirst, {
        id: RECURSO_ID,
        scoreTotal: 10,
        questionario: { regras: [], modulos: [], labelEscolha: [] },
      });
    },
    effect: () => db.avaliacao.findFirst,
    dbCalls: () => [db.avaliacao.findFirst],
  },
  {
    name: "DELETE /avaliacoes/:id",
    method: "DELETE",
    path: `/api/avaliacoes/${RECURSO_ID}`,
    expectedStatus: 204,
    arrange: () => {
      mockOwned(db.avaliacao.findFirst, { id: RECURSO_ID });
      mockValue(db.avaliacao.delete, {});
    },
    effect: () => db.avaliacao.delete,
    dbCalls: () => [db.avaliacao.findFirst, db.avaliacao.delete],
  },
  // ----- Pacientes (sub-rota clínica) -----
  {
    name: "GET /pacientes/:id/avaliacoes",
    method: "GET",
    path: `/api/pacientes/${PACIENTE_ID}/avaliacoes`,
    expectedStatus: 200,
    scopedList: true,
    arrange: () => {
      mockValue(db.avaliacao.findMany, []);
      mockValue(db.avaliacao.count, 0);
    },
    effect: () => db.avaliacao.findMany,
    dbCalls: () => [db.avaliacao.findMany, db.avaliacao.count],
  },
  // ----- Planos alimentares -----
  {
    name: "GET /planos-alimentares",
    method: "GET",
    path: "/api/planos-alimentares",
    expectedStatus: 200,
    scopedList: true,
    arrange: () => mockValue(db.planoAlimentar.findMany, []),
    effect: () => db.planoAlimentar.findMany,
    dbCalls: () => [db.planoAlimentar.findMany],
  },
  {
    name: "GET /planos-alimentares/:id",
    method: "GET",
    path: `/api/planos-alimentares/${RECURSO_ID}`,
    expectedStatus: 200,
    arrange: () => mockOwned(db.planoAlimentar.findFirst, { id: RECURSO_ID }),
    effect: () => db.planoAlimentar.findFirst,
    dbCalls: () => [db.planoAlimentar.findFirst],
  },
  {
    name: "POST /planos-alimentares",
    method: "POST",
    path: "/api/planos-alimentares",
    body: { pacienteId: PACIENTE_ID, titulo: "Plano", refeicoes: [] },
    expectedStatus: 201,
    arrange: () => {
      mockOwned(db.paciente.findFirst, { id: PACIENTE_ID });
      mockValue(db.planoAlimentar.create, { id: RECURSO_ID });
    },
    effect: () => db.planoAlimentar.create,
    dbCalls: () => [db.paciente.findFirst, db.planoAlimentar.create],
  },
  {
    name: "PUT /planos-alimentares/:id",
    method: "PUT",
    path: `/api/planos-alimentares/${RECURSO_ID}`,
    body: { titulo: "Novo título" },
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.planoAlimentar.findFirst, { id: RECURSO_ID });
      db.$transaction.mockImplementation(async (callback: any) => callback(prismaMock));
      mockValue(db.planoAlimentar.update, { id: RECURSO_ID });
    },
    effect: () => db.planoAlimentar.update,
    dbCalls: () => [db.planoAlimentar.findFirst, db.planoAlimentar.update],
  },
  {
    name: "DELETE /planos-alimentares/:id",
    method: "DELETE",
    path: `/api/planos-alimentares/${RECURSO_ID}`,
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.planoAlimentar.findFirst, { id: RECURSO_ID });
      mockValue(db.planoAlimentar.delete, {});
    },
    effect: () => db.planoAlimentar.delete,
    dbCalls: () => [db.planoAlimentar.findFirst, db.planoAlimentar.delete],
  },
  // ----- Exames de pacientes -----
  {
    name: "GET /exames/paciente/:pacienteId",
    method: "GET",
    path: `/api/exames/paciente/${PACIENTE_ID}`,
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.paciente.findFirst, { id: PACIENTE_ID });
      mockValue(db.solicitacaoExame.findMany, []);
    },
    effect: () => db.solicitacaoExame.findMany,
    dbCalls: () => [db.paciente.findFirst, db.solicitacaoExame.findMany],
  },
  {
    name: "POST /exames/paciente/:pacienteId",
    method: "POST",
    path: `/api/exames/paciente/${PACIENTE_ID}`,
    body: { pacienteId: PACIENTE_ID, exameBaseIds: [EXAME_BASE_ID] },
    expectedStatus: 201,
    arrange: () => {
      mockOwned(db.paciente.findFirst, { id: PACIENTE_ID });
      db.exameBase.count.mockImplementation(async (args: any) =>
        clinicaIdOf(args?.where) === CLINICA_A ? 1 : 0,
      );
      mockValue(db.solicitacaoExame.create, { id: RECURSO_ID });
    },
    effect: () => db.solicitacaoExame.create,
    dbCalls: () => [db.paciente.findFirst, db.exameBase.count, db.solicitacaoExame.create],
  },
  {
    name: "POST /exames/paciente/:pacienteId/externo",
    method: "POST",
    path: `/api/exames/paciente/${PACIENTE_ID}/externo`,
    body: {
      dataResultado: "2026-05-12",
      itens: [{ exameBaseId: EXAME_BASE_ID, resultado: "90" }],
    },
    expectedStatus: 201,
    arrange: () => {
      mockOwned(db.paciente.findFirst, { id: PACIENTE_ID });
      db.exameBase.count.mockImplementation(async (args: any) =>
        clinicaIdOf(args?.where) === CLINICA_A ? 1 : 0,
      );
      mockValue(db.solicitacaoExame.create, { id: RECURSO_ID });
    },
    effect: () => db.solicitacaoExame.create,
    dbCalls: () => [db.paciente.findFirst, db.exameBase.count, db.solicitacaoExame.create],
  },
  {
    name: "DELETE /exames/:id",
    method: "DELETE",
    path: `/api/exames/${RECURSO_ID}`,
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.solicitacaoExame.findFirst, { id: RECURSO_ID });
      mockValue(db.solicitacaoExame.delete, {});
    },
    effect: () => db.solicitacaoExame.delete,
    dbCalls: () => [db.solicitacaoExame.findFirst, db.solicitacaoExame.delete],
  },
  {
    name: "POST /exames/resultado",
    method: "POST",
    path: "/api/exames/resultado",
    body: { itemId: RECURSO_ID, dataResultado: "2026-05-12", resultado: "OK" },
    expectedStatus: 200,
    arrange: () => {
      mockOwned(db.solicitacaoExameItem.findFirst, { id: RECURSO_ID });
      mockValue(db.solicitacaoExameItem.update, { id: RECURSO_ID });
    },
    effect: () => db.solicitacaoExameItem.update,
    dbCalls: () => [db.solicitacaoExameItem.findFirst, db.solicitacaoExameItem.update],
  },
];

describe("autorização clínica (HTTP)", () => {
  describe.each(clinicalEndpoints)("$name", (endpoint) => {
    const request = (token?: string) =>
      call(endpoint.method, endpoint.path, token, endpoint.body);

    it("retorna 401 sem token e não toca o banco", async () => {
      endpoint.arrange();
      const res = await request();
      expect(res.status).toBe(401);
      endpoint.dbCalls().forEach((fn) => expect(fn).not.toHaveBeenCalled());
    });

    it("retorna 401 com token inválido e não toca o banco", async () => {
      endpoint.arrange();
      const res = await request("token-invalido");
      expect(res.status).toBe(401);
      endpoint.dbCalls().forEach((fn) => expect(fn).not.toHaveBeenCalled());
    });

    it("retorna 403 para SECRETARIA em clínica e não toca o banco", async () => {
      endpoint.arrange();
      const res = await request(tokenFor("SECRETARIA", "CLINICA"));
      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false });
      endpoint.dbCalls().forEach((fn) => expect(fn).not.toHaveBeenCalled());
    });

    it.each<Perfil>(["NUTRICIONISTA", "ADMIN"])(
      "permite %s em clínica e aplica o efeito no banco",
      async (perfil) => {
        endpoint.arrange();
        const res = await request(tokenFor(perfil, "CLINICA"));
        expect(res.status).toBe(endpoint.expectedStatus);
        expect(endpoint.effect()).toHaveBeenCalledTimes(1);
      },
    );

    it.each<Perfil>(["ADMIN", "SECRETARIA", "NUTRICIONISTA"])(
      "mantém acesso total para %s em clínica AUTONOMO",
      async (perfil) => {
        endpoint.arrange();
        const res = await request(tokenFor(perfil, "AUTONOMO"));
        expect(res.status).toBe(endpoint.expectedStatus);
        expect(endpoint.effect()).toHaveBeenCalledTimes(1);
      },
    );

    it.each<[Perfil, TipoClinica]>([
      ["NUTRICIONISTA", "CLINICA"],
      ["ADMIN", "CLINICA"],
      ["NUTRICIONISTA", "AUTONOMO"],
      ["ADMIN", "AUTONOMO"],
    ])(
      "não acessa nem altera recurso de outra clínica (%s / %s)",
      async (perfil, tipoClinica) => {
        endpoint.arrange();
        const res = await request(tokenFor(perfil, tipoClinica, CLINICA_B));

        if (endpoint.scopedList) {
          // Listagem filtrada pela clínica do token: nada da CLINICA_A é retornado.
          expect(res.status).toBe(endpoint.expectedStatus);
          const filtro = endpoint.effect().mock.calls[0][0].where;
          expect(clinicaIdOf(filtro)).toBe(CLINICA_B);
        } else {
          expect(res.status).toBe(404);
          // Toda chamada ao banco deve estar filtrada pela clínica do token. Para escritas
          // (create/update/delete) isso significa que não podem ter sido executadas.
          for (const [args] of endpoint.effect().mock.calls) {
            expect(clinicaIdOf((args as any)?.where)).toBe(CLINICA_B);
          }
        }
      },
    );
  });

  describe("exames: itens de exame de outra clínica", () => {
    it("rejeita solicitação com exame base de outra clínica (400) sem criar nada", async () => {
      mockOwned(db.paciente.findFirst, { id: PACIENTE_ID });
      mockValue(db.exameBase.count, 0);

      const res = await call(
        "POST",
        `/api/exames/paciente/${PACIENTE_ID}`,
        tokenFor("NUTRICIONISTA"),
        { pacienteId: PACIENTE_ID, exameBaseIds: [EXAME_BASE_ID] },
      );

      expect(res.status).toBe(400);
      expect(db.solicitacaoExame.create).not.toHaveBeenCalled();
    });
  });

  describe("validação preservada após a autorização", () => {
    it.each<Perfil>(["NUTRICIONISTA", "ADMIN"])(
      "%s recebe 422 com corpo inválido (validate continua ativo)",
      async (perfil) => {
        const res = await call(
          "POST",
          `/api/prontuario/${PACIENTE_ID}/medidas`,
          tokenFor(perfil),
          { pacienteId: "nao-e-uuid" },
        );
        expect(res.status).toBe(422);
        expect(db.medida.create).not.toHaveBeenCalled();
      },
    );

    it("SECRETARIA recebe 403 (e não 422) com corpo inválido: o guard roda antes da validação", async () => {
      const res = await call(
        "POST",
        `/api/prontuario/${PACIENTE_ID}/medidas`,
        tokenFor("SECRETARIA"),
        { pacienteId: "nao-e-uuid" },
      );
      expect(res.status).toBe(403);
    });
  });

  describe("rotas cadastrais e administrativas permanecem acessíveis a ADMIN e SECRETARIA", () => {
    describe.each<Perfil>(["ADMIN", "SECRETARIA"])("%s", (perfil) => {
      const token = () => tokenFor(perfil, "CLINICA");

      it("GET /pacientes retorna 200", async () => {
        mockValue(db.paciente.findMany, []);
        mockValue(db.paciente.count, 0);
        const res = await call("GET", "/api/pacientes", token());
        expect(res.status).toBe(200);
        expect(db.paciente.findMany).toHaveBeenCalledTimes(1);
      });

      it("GET /pacientes/:id retorna 200 sem dados clínicos relacionados", async () => {
        mockValue(db.paciente.findFirst, { id: PACIENTE_ID, nome: "Ana", convenio: null, agendamentos: [] });
        const res = await call("GET", `/api/pacientes/${PACIENTE_ID}`, token());

        expect(res.status).toBe(200);
        const { where, include } = db.paciente.findFirst.mock.calls[0][0];
        expect(where).toEqual({ id: PACIENTE_ID, clinicaId: CLINICA_A });
        expect(Object.keys(include).sort()).toEqual(["agendamentos", "convenio"]);
        for (const relacaoClinica of [
          "evolucoes",
          "medidas",
          "solicitacoes",
          "avaliacoesQuestionarios",
          "respostasQuestionarios",
          "planosAlimentares",
        ]) {
          expect(res.body.data).not.toHaveProperty(relacaoClinica);
        }
      });

      it("POST /pacientes retorna 201 e grava na clínica do token", async () => {
        mockValue(db.paciente.create, { id: PACIENTE_ID });
        const res = await call("POST", "/api/pacientes", token(), {
          nome: "Maria Souza",
          cpf: "12345678901",
          whatsapp: "11999998888",
        });
        expect(res.status).toBe(201);
        expect(db.paciente.create.mock.calls[0][0].data.clinicaId).toBe(CLINICA_A);
      });

      it("PUT /pacientes/:id retorna 200", async () => {
        mockOwned(db.paciente.findFirst, { id: PACIENTE_ID });
        mockValue(db.paciente.update, { id: PACIENTE_ID });
        const res = await call("PUT", `/api/pacientes/${PACIENTE_ID}`, token(), { nome: "Maria S." });
        expect(res.status).toBe(200);
        expect(db.paciente.update).toHaveBeenCalledTimes(1);
      });

      it("GET /exames/base (catálogo) retorna 200", async () => {
        mockValue(db.exameBase.findMany, []);
        const res = await call("GET", "/api/exames/base", token());
        expect(res.status).toBe(200);
      });

      it("GET /agendamentos retorna 200 sem relações clínicas", async () => {
        mockValue(db.agendamento.findMany, []);
        const res = await call("GET", "/api/agendamentos?data=2026-05-12", token());
        expect(res.status).toBe(200);
        const { include } = db.agendamento.findMany.mock.calls[0][0];
        expect(Object.keys(include).sort()).toEqual(["convenio", "nutricionista", "paciente"]);
        expect(Object.keys(include.paciente.select).sort()).toEqual(["email", "id", "nome", "telefone"]);
      });

      it("GET /agendamentos/:id/guia-tiss retorna 200 sem relações clínicas", async () => {
        mockOwned(db.agendamento.findFirst, { id: RECURSO_ID, paciente: {}, nutricionista: null, criadoPor: null });
        const res = await call("GET", `/api/agendamentos/${RECURSO_ID}/guia-tiss`, token());
        expect(res.status).toBe(200);
        const { include } = db.agendamento.findFirst.mock.calls[0][0];
        expect(Object.keys(include).sort()).toEqual(["clinica", "convenio", "criadoPor", "nutricionista", "paciente"]);
        expect(Object.keys(include.paciente.include)).toEqual(["convenio"]);
      });

      it("GET /relatorios retorna 200 apenas com dados de agendamento", async () => {
        mockValue(db.agendamento.findMany, []);
        const res = await call("GET", "/api/relatorios", token());
        expect(res.status).toBe(200);
        const { include } = db.agendamento.findMany.mock.calls[0][0];
        expect(Object.keys(include).sort()).toEqual(["convenio", "paciente"]);
        expect(Object.keys(include.paciente.select).sort()).toEqual(["id", "nome", "telefone"]);
      });

      it("GET /dashboard retorna 200", async () => {
        mockValue(db.paciente.count, 0);
        mockValue(db.agendamento.count, 0);
        mockValue(db.agendamento.findMany, []);
        const res = await call("GET", "/api/dashboard", token());
        expect(res.status).toBe(200);
        expect(res.body.data).not.toHaveProperty("evolucoes");
        expect(res.body.data).not.toHaveProperty("medidas");
      });
    });
  });

  describe("fluxo público de questionários", () => {
    it("GET /pacientes/:id/nome responde sem token e expõe somente o nome", async () => {
      mockValue(db.paciente.findUnique, { nome: "Ana" });
      const res = await call("GET", `/api/pacientes/${PACIENTE_ID}/nome`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ nome: "Ana" });
      expect(db.paciente.findUnique.mock.calls[0][0].select).toEqual({ nome: true });
    });

    it("POST /pacientes/:id/questionarios/:qid/avaliacoes aceita resposta sem token", async () => {
      mockValue(db.paciente.findUnique, { id: PACIENTE_ID, clinicaId: CLINICA_A });
      mockValue(db.questionario.findUnique, { id: QUESTIONARIO_ID, ativo: true, clinicaId: CLINICA_A });
      mockValue(db.avaliacao.create, { id: RECURSO_ID });

      const res = await call(
        "POST",
        `/api/pacientes/${PACIENTE_ID}/questionarios/${QUESTIONARIO_ID}/avaliacoes`,
        undefined,
        { respostas: [{ perguntaId: PERGUNTA_ID, nota: 2 }] },
      );

      expect(res.status).toBe(201);
      expect(db.avaliacao.create).toHaveBeenCalledTimes(1);
    });

    it("não concede acesso público a históricos ou resultados clínicos", async () => {
      const historico = await call("GET", `/api/pacientes/${PACIENTE_ID}/avaliacoes`);
      const resultado = await call("GET", `/api/avaliacoes/${RECURSO_ID}/questionario`);
      expect(historico.status).toBe(401);
      expect(resultado.status).toBe(401);
      expect(db.avaliacao.findMany).not.toHaveBeenCalled();
      expect(db.avaliacao.findFirst).not.toHaveBeenCalled();
    });
  });
});
