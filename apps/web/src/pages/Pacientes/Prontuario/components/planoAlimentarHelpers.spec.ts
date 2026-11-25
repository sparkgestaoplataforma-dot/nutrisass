import {
  createPlanoAlimentarSchema,
  updatePlanoAlimentarSchema,
  ObjetivoPlano,
} from "@nutricao/shared";
import type { PlanoAlimentarAPI } from "@/services/planoAlimentar";
import {
  MAX_OPCOES_REFEICAO,
  aplicarModeloNoEstadoFormulario,
  criarNovaOpcaoComSubstituicao,
  extrairMensagemErroApi,
  extrairUpdatePlanoInput,
  formatarErroZodPlano,
  podeCriarNovaOpcao,
  podeExcluirModeloClinica,
  precisaConfirmarSubstituicaoRefeicoes,
} from "./planoAlimentarHelpers";

let seq = 0;
const nextUid = () => `uid-${++seq}`;

function criarModeloMock(overrides: Partial<PlanoAlimentarAPI> = {}): PlanoAlimentarAPI {
  return {
    id: "modelo-1",
    clinicaId: "clinica-1",
    pacienteId: null,
    isTemplate: true,
    usuarioId: "user-autor",
    titulo: "Protocolo Low Carb (Modelo)",
    objetivo: null,
    metaCalorias: null,
    metaProteinas: null,
    metaCarboidratos: null,
    metaGorduras: null,
    recomendacaoAguaMl: null,
    observacoes: null,
    criadoEm: "2026-11-20T00:00:00.000Z",
    atualizadoEm: "2026-11-20T00:00:00.000Z",
    refeicoes: [
      {
        id: "r-1",
        nome: "Café da Manhã",
        horario: "08:00",
        ordem: 0,
        opcoes: [
          {
            id: "o-1",
            nome: "Opção 1",
            ordem: 0,
            alimentos: [
              {
                id: "a-1",
                alimentoId: "al-1",
                medidaCaseiraId: null,
                alimento: "Ovos mexidos",
                quantidade: 100,
                unidade: "g",
                calorias: 155,
                proteinas: 13,
                carboidratos: 1.1,
                gorduras: 11,
                observacao: null,
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("planoAlimentarHelpers — Fluxos Críticos de Frontend", () => {
  describe("BUG-01: aplicarModeloNoEstadoFormulario", () => {
    it("deve aplicar modelo completo sobre formulário vazio", () => {
      const modelo = criarModeloMock({
        objetivo: ObjetivoPlano.HIPERTROFIA,
        metaCalorias: 2800,
        metaProteinas: 180,
        metaCarboidratos: 350,
        metaGorduras: 75,
        recomendacaoAguaMl: 3200,
        observacoes: "Tomar creatina 5g",
      });

      const estado = aplicarModeloNoEstadoFormulario(modelo, nextUid);
      expect(estado.titulo).toBe("Protocolo Low Carb");
      expect(estado.objetivo).toBe(ObjetivoPlano.HIPERTROFIA);
      expect(estado.metaCalorias).toBe("2800");
      expect(estado.metaProteinas).toBe("180");
      expect(estado.metaCarboidratos).toBe("350");
      expect(estado.metaGorduras).toBe("75");
      expect(estado.aguaMl).toBe("3200");
      expect(estado.observacoes).toBe("Tomar creatina 5g");
      expect(estado.refeicoes).toHaveLength(1);
      expect(estado.refeicoes[0].opcoes[0].alimentos[0].alimento).toBe("Ovos mexidos");
    });

    it("deve limpar todos os campos nulos/ausentes do novo modelo ao substituir um formulário preenchido e preservar o modelo original", () => {
      const modeloComNulos = criarModeloMock({
        titulo: "Modelo Limpo",
        objetivo: null,
        metaCalorias: 1600,
        metaProteinas: null,
        metaCarboidratos: null,
        metaGorduras: null,
        recomendacaoAguaMl: null,
        observacoes: null,
      });

      // Congela profundamente o objeto de entrada para provar imutabilidade
      Object.freeze(modeloComNulos);
      Object.freeze(modeloComNulos.refeicoes);
      Object.freeze(modeloComNulos.refeicoes[0]);

      const estado = aplicarModeloNoEstadoFormulario(modeloComNulos, nextUid);
      expect(estado.titulo).toBe("Modelo Limpo");
      expect(estado.objetivo).toBe("");
      expect(estado.metaCalorias).toBe("1600");
      expect(estado.metaProteinas).toBe("");
      expect(estado.metaCarboidratos).toBe("");
      expect(estado.metaGorduras).toBe("");
      expect(estado.aguaMl).toBe("");
      expect(estado.observacoes).toBe("");
    });

    it("deve exigir confirmação apenas quando o formulário já possuir refeições montadas", () => {
      expect(precisaConfirmarSubstituicaoRefeicoes([])).toBe(false);
      const estado = aplicarModeloNoEstadoFormulario(criarModeloMock(), nextUid);
      expect(precisaConfirmarSubstituicaoRefeicoes(estado.refeicoes)).toBe(true);
    });
  });

  describe("BUG-05: Limite de 10 opções por refeição", () => {
    it("deve permitir criar nova opção enquanto total < 10 e bloquear ao atingir 10", () => {
      expect(podeCriarNovaOpcao(9)).toBe(true);
      expect(podeCriarNovaOpcao(MAX_OPCOES_REFEICAO)).toBe(false);

      const estado = aplicarModeloNoEstadoFormulario(criarModeloMock(), nextUid);
      const refeicao = estado.refeicoes[0];
      const opcaoBase = refeicao.opcoes[0];

      // Preenche até 10 opções
      while (refeicao.opcoes.length < MAX_OPCOES_REFEICAO) {
        refeicao.opcoes.push({
          ...opcaoBase,
          _uid: nextUid(),
          ordem: refeicao.opcoes.length,
        });
      }

      const novoAlimento = { ...opcaoBase.alimentos[0], _uid: nextUid(), alimento: "Frango" };
      const resultado = criarNovaOpcaoComSubstituicao(
        [refeicao],
        refeicao._uid,
        opcaoBase._uid,
        opcaoBase.alimentos[0]._uid,
        novoAlimento,
        nextUid,
      );

      expect(resultado[0].opcoes).toHaveLength(MAX_OPCOES_REFEICAO);
    });
  });

  describe("SEC-03 e FE-02: Governança no frontend, validação e mensagens de erro", () => {
    it("podeExcluirModeloClinica deve espelhar a regra de autor/ADMIN/AUTONOMO", () => {
      const modelo = { usuarioId: "autor-1" };
      expect(
        podeExcluirModeloClinica(modelo, {
          userId: "autor-1",
          perfil: "NUTRICIONISTA",
          tipoClinica: "CLINICA",
        }),
      ).toBe(true);
      expect(
        podeExcluirModeloClinica(modelo, {
          userId: "outro-nutri",
          perfil: "NUTRICIONISTA",
          tipoClinica: "CLINICA",
        }),
      ).toBe(false);
      expect(
        podeExcluirModeloClinica(modelo, {
          userId: "admin-1",
          perfil: "ADMIN",
          tipoClinica: "CLINICA",
        }),
      ).toBe(true);
      expect(
        podeExcluirModeloClinica(modelo, {
          userId: "outro",
          perfil: "NUTRICIONISTA",
          tipoClinica: "AUTONOMO",
        }),
      ).toBe(true);
    });

    it("extrairUpdatePlanoInput e schemas compartilhados devem validar payloads antes do envio", () => {
      const createPayload = {
        pacienteId: "11111111-1111-4111-8111-111111111111",
        isTemplate: false,
        titulo: "Plano Editado",
        refeicoes: [],
      };
      expect(createPlanoAlimentarSchema.safeParse(createPayload).success).toBe(true);

      const updateInput = extrairUpdatePlanoInput(createPayload);
      expect("pacienteId" in updateInput).toBe(false);
      expect("isTemplate" in updateInput).toBe(false);
      expect(updatePlanoAlimentarSchema.safeParse(updateInput).success).toBe(true);

      const invalid = createPlanoAlimentarSchema.safeParse({
        pacienteId: "11111111-1111-4111-8111-111111111111",
        titulo: "",
        refeicoes: [],
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(formatarErroZodPlano(invalid.error)).toBe("O título do plano é obrigatório.");
      }

      expect(
        extrairMensagemErroApi(
          { response: { data: { message: "Erro do servidor" } } },
          "Fallback",
        ),
      ).toBe("Erro do servidor");
      expect(extrairMensagemErroApi(null, "Fallback")).toBe("Fallback");
    });
  });
});
