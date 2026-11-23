import type { CreatePlanoAlimentarInput } from '@nutricao/shared';

export interface BaseNutricional100g {
  cal: number;
  prot: number;
  carb: number;
  gord: number;
  fibra: number;
}

export interface MedidaCaseiraSimples {
  id: string;
  nome: string;
  quantidadeEmGramas: number;
}

export interface AlimentoCalculavel {
  _uid: string;
  alimentoId: string | null;
  medidaCaseiraId: string | null;
  alimento: string;
  quantidade: number;
  unidade: string;
  calorias: number | null;
  proteinas: number | null;
  carboidratos: number | null;
  gorduras: number | null;
  fibra?: number | null;
  observacao: string | null;
  _basePer100: BaseNutricional100g;
  _medidasCaseiras: MedidaCaseiraSimples[];
}

export interface TotaisNutricionais {
  cal: number;
  prot: number;
  carb: number;
  gord: number;
  fibra: number;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

export function calcMacrosPorGramas(
  base: BaseNutricional100g,
  qtdGramas: number,
) {
  const f = Math.max(0, qtdGramas) / 100;
  return {
    calorias: round1(base.cal * f),
    proteinas: round1(base.prot * f),
    carboidratos: round1(base.carb * f),
    gorduras: round1(base.gord * f),
    fibra: round1((base.fibra || 0) * f),
  };
}

/**
 * Extrai a base nutricional por 100g de um item salvo no plano alimentar.
 * Corrige o Bug #1A onde editar um plano salvo zerava `_basePer100`.
 */
export function extrairBasePor100g(item: {
  quantidade: number;
  unidade?: string | null;
  medidaCaseiraId?: string | null;
  calorias?: number | null;
  proteinas?: number | null;
  carboidratos?: number | null;
  gorduras?: number | null;
  fibra?: number | null;
  alimentoRel?: {
    calorias?: number | null;
    proteinas?: number | null;
    carboidratos?: number | null;
    gorduras?: number | null;
    fibra?: number | null;
    medidasCaseiras?: MedidaCaseiraSimples[];
  } | null;
}): BaseNutricional100g {
  if (item.alimentoRel) {
    return {
      cal: item.alimentoRel.calorias ?? 0,
      prot: item.alimentoRel.proteinas ?? 0,
      carb: item.alimentoRel.carboidratos ?? 0,
      gord: item.alimentoRel.gorduras ?? 0,
      fibra: item.alimentoRel.fibra ?? 0,
    };
  }

  let qtdGramas = item.quantidade || 0;
  if (qtdGramas <= 0) {
    return { cal: 0, prot: 0, carb: 0, gord: 0, fibra: 0 };
  }

  const fator = 100 / qtdGramas;
  return {
    cal: round1((item.calorias ?? 0) * fator),
    prot: round1((item.proteinas ?? 0) * fator),
    carb: round1((item.carboidratos ?? 0) * fator),
    gord: round1((item.gorduras ?? 0) * fator),
    fibra: round1((item.fibra ?? 0) * fator),
  };
}

export function filtrarMedidasCaseirasValidas(
  medidas?: MedidaCaseiraSimples[] | null,
): MedidaCaseiraSimples[] {
  if (!medidas) return [];
  return medidas.filter((m) => {
    const n = m.nome.trim().toLowerCase();
    return n !== 'g' && n !== 'grama' && n !== 'gramas';
  });
}

export function formatarLabelMedidaCaseira(mc: MedidaCaseiraSimples): string {
  const nome = mc.nome.trim();
  if (
    nome.toLowerCase() === 'ml' ||
    nome.includes('(') ||
    /\d+\s*(g|ml)\b/i.test(nome)
  ) {
    return nome;
  }
  return `${nome} (${mc.quantidadeEmGramas}g)`;
}

/**
 * Cria o estado inicial de um alimento recém-adicionado ao construtor de plano alimentar.
 */
export function criarAlimentoInicial(
  api: {
    id: string;
    nome: string;
    calorias?: number | null;
    proteinas?: number | null;
    carboidratos?: number | null;
    gorduras?: number | null;
    fibra?: number | null;
    medidasCaseiras?: MedidaCaseiraSimples[] | null;
  },
  uidStr: string,
): AlimentoCalculavel {
  const medidasLimpas = filtrarMedidasCaseirasValidas(api.medidasCaseiras);
  const defaultMeasure = medidasLimpas.find(
    (m) => m.nome.trim().toLowerCase() === 'ml',
  );
  const basePer100: BaseNutricional100g = {
    cal: api.calorias ?? 0,
    prot: api.proteinas ?? 0,
    carb: api.carboidratos ?? 0,
    gord: api.gorduras ?? 0,
    fibra: api.fibra ?? 0,
  };
  return {
    _uid: uidStr,
    alimentoId: api.id,
    medidaCaseiraId: defaultMeasure ? defaultMeasure.id : null,
    alimento: api.nome,
    quantidade: 100,
    unidade: defaultMeasure ? defaultMeasure.nome : 'g',
    calorias: api.calorias ?? 0,
    proteinas: api.proteinas ?? 0,
    carboidratos: api.carboidratos ?? 0,
    gorduras: api.gorduras ?? 0,
    fibra: api.fibra ?? 0,
    observacao: null,
    _basePer100: basePer100,
    _medidasCaseiras: medidasLimpas,
  };
}

/**
 * Hidrata um item salvo vindo da API para edição no PlanoAlimentarBuilder,
 * preservando `_basePer100` e calculando `fibra` proporcional.
 */
export function hidratarAlimentoSalvo(
  item: {
    alimentoId: string | null;
    medidaCaseiraId: string | null;
    alimento: string;
    quantidade: number;
    unidade: string;
    calorias: number | null;
    proteinas: number | null;
    carboidratos: number | null;
    gorduras: number | null;
    fibra?: number | null;
    observacao: string | null;
    alimentoRel?: {
      calorias?: number | null;
      proteinas?: number | null;
      carboidratos?: number | null;
      gorduras?: number | null;
      fibra?: number | null;
      medidasCaseiras?: MedidaCaseiraSimples[];
    } | null;
  },
  uidStr: string,
): AlimentoCalculavel {
  const basePer100 = extrairBasePor100g(item);
  const todasMedidas = item.alimentoRel?.medidasCaseiras ?? [];
  const medidasLimpas = filtrarMedidasCaseirasValidas(todasMedidas);

  // Se o item estava vinculado à medida 'g' redundante do banco, normaliza para medidaCaseiraId = null ('g')
  const mcOriginal = item.medidaCaseiraId
    ? todasMedidas.find((m) => m.id === item.medidaCaseiraId)
    : null;
  const isGramaRedundante =
    mcOriginal &&
    ['g', 'grama', 'gramas'].includes(mcOriginal.nome.trim().toLowerCase());
  const medidaCaseiraIdNormalizada = isGramaRedundante
    ? null
    : item.medidaCaseiraId;

  const qtdGramas = mcOriginal
    ? mcOriginal.quantidadeEmGramas * item.quantidade
    : item.quantidade;
  const fibraCalculada =
    typeof item.fibra === 'number'
      ? item.fibra
      : round1((basePer100.fibra * qtdGramas) / 100);

  return {
    _uid: uidStr,
    alimentoId: item.alimentoId,
    medidaCaseiraId: medidaCaseiraIdNormalizada,
    alimento: item.alimento,
    quantidade: item.quantidade,
    unidade: isGramaRedundante ? 'g' : item.unidade,
    calorias: item.calorias,
    proteinas: item.proteinas,
    carboidratos: item.carboidratos,
    gorduras: item.gorduras,
    fibra: fibraCalculada,
    observacao: item.observacao,
    _basePer100: basePer100,
    _medidasCaseiras: medidasLimpas,
  };
}

/**
 * Recalcula um item do plano alimentar ao alterar `quantidade`, `medidaCaseiraId` ou outros campos.
 * Corrige os Bugs #1B e #1C (multiplicação por medida caseira, reset de 100g -> 1 unidade e retorno para gramas).
 */
export function recalcularAlimentoPlano<T extends AlimentoCalculavel>(
  item: T,
  field: string,
  value: any,
): T {
  const updated: T = { ...item, [field]: value };
  const hasBase =
    updated._basePer100.cal > 0 ||
    updated._basePer100.prot > 0 ||
    updated._basePer100.carb > 0 ||
    updated._basePer100.gord > 0 ||
    updated._basePer100.fibra > 0;

  if (field === 'medidaCaseiraId') {
    const novoMcId = value || null;
    updated.medidaCaseiraId = novoMcId;

    if (novoMcId) {
      const mc = updated._medidasCaseiras.find((m) => m.id === novoMcId);
      if (mc) {
        // Se estava em gramas ("g") ou ml com o padrão 100 e a medida caseira tem > 1g, ajusta automaticamente para 1 unidade
        if (!item.medidaCaseiraId && item.quantidade === 100 && mc.quantidadeEmGramas > 1) {
          updated.quantidade = 1;
        }
        updated.unidade = mc.nome;
        const qtdG = mc.quantidadeEmGramas * updated.quantidade;
        if (hasBase) {
          const m = calcMacrosPorGramas(updated._basePer100, qtdG);
          updated.calorias = m.calorias;
          updated.proteinas = m.proteinas;
          updated.carboidratos = m.carboidratos;
          updated.gorduras = m.gorduras;
          updated.fibra = m.fibra;
        }
      }
    } else {
      // Voltou de uma medida caseira para gramas ("g")
      const prevMc = item.medidaCaseiraId
        ? item._medidasCaseiras.find((m) => m.id === item.medidaCaseiraId)
        : null;
      updated.unidade = 'g';
      if (prevMc && item.quantidade > 0) {
        updated.quantidade = round1(prevMc.quantidadeEmGramas * item.quantidade);
      }
      if (hasBase) {
        const m = calcMacrosPorGramas(updated._basePer100, updated.quantidade);
        updated.calorias = m.calorias;
        updated.proteinas = m.proteinas;
        updated.carboidratos = m.carboidratos;
        updated.gorduras = m.gorduras;
        updated.fibra = m.fibra;
      }
    }
    return updated;
  }

  if (field === 'quantidade') {
    const novaQtd =
      typeof value === 'number' && !Number.isNaN(value) ? Math.max(0, value) : 0;
    updated.quantidade = novaQtd;

    const mc = updated.medidaCaseiraId
      ? updated._medidasCaseiras.find((m) => m.id === updated.medidaCaseiraId)
      : null;
    const qtdG = mc ? mc.quantidadeEmGramas * novaQtd : novaQtd;

    if (hasBase) {
      const m = calcMacrosPorGramas(updated._basePer100, qtdG);
      updated.calorias = m.calorias;
      updated.proteinas = m.proteinas;
      updated.carboidratos = m.carboidratos;
      updated.gorduras = m.gorduras;
      updated.fibra = m.fibra;
    }
    return updated;
  }

  return updated;
}

/**
 * Soma os macronutrientes e fibras de uma lista de alimentos (uma opção de refeição).
 */
export function calcularTotaisAlimentos(
  alimentos: Array<{
    calorias?: number | null;
    proteinas?: number | null;
    carboidratos?: number | null;
    gorduras?: number | null;
    fibra?: number | null;
    alimentoRel?: { fibra?: number | null; medidasCaseiras?: MedidaCaseiraSimples[] } | null;
    quantidade?: number;
    medidaCaseiraId?: string | null;
  }>,
): TotaisNutricionais {
  let cal = 0;
  let prot = 0;
  let carb = 0;
  let gord = 0;
  let fibra = 0;

  for (const a of alimentos) {
    cal += a.calorias || 0;
    prot += a.proteinas || 0;
    carb += a.carboidratos || 0;
    gord += a.gorduras || 0;
    if (typeof a.fibra === 'number') {
      fibra += a.fibra;
    } else if (a.alimentoRel?.fibra && a.quantidade) {
      const mc = a.medidaCaseiraId
        ? a.alimentoRel.medidasCaseiras?.find((m) => m.id === a.medidaCaseiraId)
        : null;
      const qtdG = mc ? mc.quantidadeEmGramas * a.quantidade : a.quantidade;
      fibra += round1((a.alimentoRel.fibra * qtdG) / 100);
    }
  }

  return {
    cal: round1(cal),
    prot: round1(prot),
    carb: round1(carb),
    gord: round1(gord),
    fibra: round1(fibra),
  };
}

/**
 * Calcula o resumo diário do plano alimentar de forma unificada entre Builder, View e PDF.
 * - `principal`: Soma a Opção 1 (`opcoes[0]`) de cada refeição.
 * - `media`: Soma a média aritmética de todas as opções de cada refeição.
 */
export function calcularTotaisPlano(
  refeicoes: Array<{
    opcoes: Array<{
      alimentos: Array<{
        calorias?: number | null;
        proteinas?: number | null;
        carboidratos?: number | null;
        gorduras?: number | null;
        fibra?: number | null;
        alimentoRel?: { fibra?: number | null; medidasCaseiras?: MedidaCaseiraSimples[] } | null;
        quantidade?: number;
        medidaCaseiraId?: string | null;
      }>;
    }>;
  }>,
  modo: 'principal' | 'media' = 'principal',
): TotaisNutricionais {
  let cal = 0;
  let prot = 0;
  let carb = 0;
  let gord = 0;
  let fibra = 0;

  for (const ref of refeicoes) {
    if (!ref.opcoes || ref.opcoes.length === 0) continue;

    if (modo === 'principal') {
      const t = calcularTotaisAlimentos(ref.opcoes[0].alimentos);
      cal += t.cal;
      prot += t.prot;
      carb += t.carb;
      gord += t.gord;
      fibra += t.fibra;
    } else {
      let refCal = 0;
      let refProt = 0;
      let refCarb = 0;
      let refGord = 0;
      let refFibra = 0;
      for (const opc of ref.opcoes) {
        const t = calcularTotaisAlimentos(opc.alimentos);
        refCal += t.cal;
        refProt += t.prot;
        refCarb += t.carb;
        refGord += t.gord;
        refFibra += t.fibra;
      }
      const n = ref.opcoes.length;
      cal += refCal / n;
      prot += refProt / n;
      carb += refCarb / n;
      gord += refGord / n;
      fibra += refFibra / n;
    }
  }

  return {
    cal: round1(cal),
    prot: round1(prot),
    carb: round1(carb),
    gord: round1(gord),
    fibra: round1(fibra),
  };
}

// ============================================================================
// MOTOR DE GASTO ENERGÉTICO (TMB / GEB e GET)
// ============================================================================

export type ProtocoloTMB =
  | 'MIFFLIN_ST_JEOR'
  | 'HARRIS_BENEDICT'
  | 'FAO_OMS'
  | 'CUNNINGHAM'
  | 'TINSLEY_PESO'
  | 'BOLSO';

export interface CalculoTMBParams {
  peso: number;
  alturaCm: number;
  idade: number;
  sexo: 'MASCULINO' | 'FEMININO';
  protocolo: ProtocoloTMB;
  massaMagraKg?: number | null;
  kcalPorKg?: number;
}

export const FATORES_ATIVIDADE = [
  { valor: 1.2, label: 'Sedentário (1.20) — Pouco ou nenhum exercício' },
  { valor: 1.375, label: 'Levemente ativo (1.375) — Exercício leve 1 a 3 dias/sem' },
  { valor: 1.55, label: 'Moderadamente ativo (1.55) — Exercício moderado 3 a 5 dias/sem' },
  { valor: 1.725, label: 'Muito ativo (1.725) — Exercício intenso 6 a 7 dias/sem' },
  { valor: 1.9, label: 'Extremamente ativo (1.90) — Treino muito pesado / atleta' },
] as const;

/**
 * Calcula a Taxa Metabólica Basal (TMB) ou Gasto Direto por Fórmula de Bolso.
 */
export function calcularTMB(params: CalculoTMBParams): number {
  const { peso, alturaCm, idade, sexo, protocolo, massaMagraKg, kcalPorKg = 25 } = params;
  if (peso <= 0) return 0;

  switch (protocolo) {
    case 'MIFFLIN_ST_JEOR': {
      if (alturaCm <= 0) return 0;
      const base = 10 * peso + 6.25 * alturaCm - 5 * Math.max(0, idade);
      return round1(sexo === 'MASCULINO' ? base + 5 : base - 161);
    }
    case 'HARRIS_BENEDICT': {
      if (alturaCm <= 0) return 0;
      if (sexo === 'MASCULINO') {
        return round1(66.473 + 13.7516 * peso + 5.0033 * alturaCm - 6.755 * Math.max(0, idade));
      }
      return round1(655.0955 + 9.5634 * peso + 1.8496 * alturaCm - 4.6756 * Math.max(0, idade));
    }
    case 'FAO_OMS': {
      if (sexo === 'MASCULINO') {
        if (idade < 30) return round1(15.057 * peso + 692.2);
        if (idade < 60) return round1(11.472 * peso + 873.1);
        return round1(11.711 * peso + 587.7);
      } else {
        if (idade < 30) return round1(14.818 * peso + 486.6);
        if (idade < 60) return round1(8.126 * peso + 845.6);
        return round1(9.082 * peso + 658.5);
      }
    }
    case 'CUNNINGHAM': {
      const mlg = massaMagraKg && massaMagraKg > 0 ? massaMagraKg : peso * 0.78;
      return round1(500 + 22 * mlg);
    }
    case 'TINSLEY_PESO': {
      return round1(24.8 * peso + 10);
    }
    case 'BOLSO': {
      return round1(peso * (kcalPorKg > 0 ? kcalPorKg : 25));
    }
    default:
      return 0;
  }
}

/**
 * Calcula o Gasto Energético Total (GET) e a Meta Calórica ajustada pelo objetivo.
 */
export function calcularGET(
  tmb: number,
  fatorAtividade: number,
  ajusteObjetivoKcal: number = 0,
): { get: number; metaCalorias: number } {
  const get = Math.round(Math.max(0, tmb) * Math.max(1, fatorAtividade));
  const metaCalorias = Math.max(0, Math.round(get + ajusteObjetivoKcal));
  return { get, metaCalorias };
}

// ============================================================================
// DISTRIBUIÇÃO DE MACRONUTRIENTES POR g/kg E % DO VET
// ============================================================================

export interface DistribuicaoMacrosInput {
  pesoKg: number;
  metaCalorias: number;
  proteinaGKg: number;
  gorduraGKg: number;
}

export interface DistribuicaoMacrosOutput {
  proteinasG: number;
  gordurasG: number;
  carboidratosG: number;
  proteinaGKg: number;
  gorduraGKg: number;
  carboidratoGKg: number;
  proteinaPct: number;
  gorduraPct: number;
  carboidratoPct: number;
}

export function calcularDistribuicaoMacrosPorGKg(
  input: DistribuicaoMacrosInput,
): DistribuicaoMacrosOutput {
  const { pesoKg, metaCalorias, proteinaGKg, gorduraGKg } = input;
  const pesoValido = Math.max(0, pesoKg);
  const calValidas = Math.max(0, metaCalorias);

  const proteinasG = Math.round(pesoValido * Math.max(0, proteinaGKg));
  const gordurasG = Math.round(pesoValido * Math.max(0, gorduraGKg));

  const kcalProt = proteinasG * 4;
  const kcalGord = gordurasG * 9;
  const kcalRestante = Math.max(0, calValidas - kcalProt - kcalGord);
  const carboidratosG = Math.round(kcalRestante / 4);

  const carboidratoGKg = pesoValido > 0 ? round1((kcalRestante / 4) / pesoValido) : 0;
  const totalKcalBase = calValidas > 0 ? calValidas : kcalProt + kcalGord + carboidratosG * 4;

  return {
    proteinasG,
    gordurasG,
    carboidratosG,
    proteinaGKg: round1(proteinaGKg),
    gorduraGKg: round1(gorduraGKg),
    carboidratoGKg: pesoValido > 0 ? Math.round(((kcalRestante / 4) / pesoValido) * 100) / 100 : 0,
    proteinaPct: totalKcalBase > 0 ? round1((kcalProt / totalKcalBase) * 100) : 0,
    gorduraPct: totalKcalBase > 0 ? round1((kcalGord / totalKcalBase) * 100) : 0,
    carboidratoPct: totalKcalBase > 0 ? round1(((carboidratosG * 4) / totalKcalBase) * 100) : 0,
  };
}

export function calcularMetricasMacro(
  gramas: number,
  tipo: 'proteina' | 'carboidrato' | 'gordura',
  pesoKg?: number | null,
  metaCalorias?: number | null,
): { gPorKg: number | null; kcal: number; percentual: number | null } {
  const g = Math.max(0, gramas || 0);
  const fatorKcal = tipo === 'gordura' ? 9 : 4;
  const kcal = Math.round(g * fatorKcal);
  const gPorKg = pesoKg && pesoKg > 0 ? round1(g / pesoKg) : null;
  const percentual = metaCalorias && metaCalorias > 0 ? round1((kcal / metaCalorias) * 100) : null;
  return { gPorKg, kcal, percentual };
}

export function calcularRecomendacaoAgua(pesoKg: number, mlPorKg: number = 35): number {
  if (!pesoKg || pesoKg <= 0) return 0;
  return Math.round(pesoKg * mlPorKg);
}

// ============================================================================
// ANTROPOMETRIA, COMPOSIÇÃO CORPORAL (POLLOCK 3 E 7) E EXAMES
// ============================================================================

export function calcularIMC(peso?: number | null, alturaCm?: number | null): number | null {
  if (!peso || !alturaCm || peso <= 0 || alturaCm <= 0) return null;
  const m = alturaCm / 100;
  return peso / (m * m);
}

/**
 * Classifica o IMC diferenciando Adultos (< 60 anos, OMS) e Idosos (>= 60 anos, Lipschitz/OPAS).
 */
export function classificarIMC(imc: number, idade?: number | null): string {
  if (idade != null && idade >= 60) {
    if (imc < 22) return 'Baixo peso (Idoso)';
    if (imc <= 27) return 'Peso adequado (Idoso)';
    return 'Excesso de peso (Idoso)';
  }
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso adequado';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

export function calcularFaixaPesoIdeal(
  alturaCm?: number | null,
  idade?: number | null,
): { min: number; max: number } | null {
  if (!alturaCm || alturaCm <= 0) return null;
  const m2 = (alturaCm / 100) ** 2;
  if (idade != null && idade >= 60) {
    return { min: round1(22 * m2), max: round1(27 * m2) };
  }
  return { min: round1(18.5 * m2), max: round1(24.9 * m2) };
}

export function calcularRCQ(
  cinturaCm?: number | null,
  quadrilCm?: number | null,
  sexo?: 'MASCULINO' | 'FEMININO' | string | null,
): { valor: number; risco: 'Baixo' | 'Moderado' | 'Alto' } | null {
  if (!cinturaCm || !quadrilCm || cinturaCm <= 0 || quadrilCm <= 0) return null;
  const valor = Math.round((cinturaCm / quadrilCm) * 100) / 100;
  const isFeminino = sexo === 'FEMININO';

  let risco: 'Baixo' | 'Moderado' | 'Alto';
  if (isFeminino) {
    risco = valor < 0.8 ? 'Baixo' : valor <= 0.85 ? 'Moderado' : 'Alto';
  } else {
    risco = valor < 0.9 ? 'Baixo' : valor < 1.0 ? 'Moderado' : 'Alto';
  }

  return { valor, risco };
}

export function calcularRCE(
  cinturaCm?: number | null,
  alturaCm?: number | null,
): { valor: number; risco: 'Adequado' | 'Elevado' } | null {
  if (!cinturaCm || !alturaCm || cinturaCm <= 0 || alturaCm <= 0) return null;
  const valor = Math.round((cinturaCm / alturaCm) * 100) / 100;
  return {
    valor,
    risco: valor >= 0.5 ? 'Elevado' : 'Adequado',
  };
}

export interface ResultadoComposicaoCorporal {
  somaDobras: number;
  densidadeCorporal: number;
  percentualGordura: number;
  massaGordaKg: number;
  massaMagraKg: number;
}

export function calcularPollock3(params: {
  sexo: 'MASCULINO' | 'FEMININO';
  idade: number;
  peso: number;
  peitoral?: number;
  abdominal?: number;
  coxa?: number;
  triceps?: number;
  suprailiaca?: number;
}): ResultadoComposicaoCorporal | null {
  const { sexo, idade, peso } = params;
  if (peso <= 0 || idade <= 0) return null;

  let soma = 0;
  let dc = 0;

  if (sexo === 'MASCULINO') {
    const { peitoral = 0, abdominal = 0, coxa = 0 } = params;
    if (peitoral <= 0 || abdominal <= 0 || coxa <= 0) return null;
    soma = peitoral + abdominal + coxa;
    dc =
      1.10938 -
      0.0008267 * soma +
      0.0000016 * (soma * soma) -
      0.0002574 * idade;
  } else {
    const { triceps = 0, suprailiaca = 0, coxa = 0 } = params;
    if (triceps <= 0 || suprailiaca <= 0 || coxa <= 0) return null;
    soma = triceps + suprailiaca + coxa;
    dc =
      1.0994921 -
      0.0009929 * soma +
      0.0000023 * (soma * soma) -
      0.0001392 * idade;
  }

  const pctGordura = Math.max(2, Math.min(70, (495 / dc) - 450));
  const massaGordaKg = round1((peso * pctGordura) / 100);
  const massaMagraKg = round1(peso - massaGordaKg);

  return {
    somaDobras: round1(soma),
    densidadeCorporal: Math.round(dc * 10000) / 10000,
    percentualGordura: round1(pctGordura),
    massaGordaKg,
    massaMagraKg,
  };
}

export function calcularPollock7(params: {
  sexo: 'MASCULINO' | 'FEMININO';
  idade: number;
  peso: number;
  peitoral: number;
  axilarMedia: number;
  triceps: number;
  subescapular: number;
  abdominal: number;
  suprailiaca: number;
  coxa: number;
}): ResultadoComposicaoCorporal | null {
  const {
    sexo,
    idade,
    peso,
    peitoral,
    axilarMedia,
    triceps,
    subescapular,
    abdominal,
    suprailiaca,
    coxa,
  } = params;
  if (
    peso <= 0 ||
    idade <= 0 ||
    peitoral <= 0 ||
    axilarMedia <= 0 ||
    triceps <= 0 ||
    subescapular <= 0 ||
    abdominal <= 0 ||
    suprailiaca <= 0 ||
    coxa <= 0
  ) {
    return null;
  }

  const soma =
    peitoral + axilarMedia + triceps + subescapular + abdominal + suprailiaca + coxa;
  const dc =
    sexo === 'MASCULINO'
      ? 1.112 -
        0.00043499 * soma +
        0.00000055 * (soma * soma) -
        0.00028826 * idade
      : 1.097 -
        0.00046971 * soma +
        0.00000056 * (soma * soma) -
        0.00012828 * idade;

  const pctGordura = Math.max(2, Math.min(70, (495 / dc) - 450));
  const massaGordaKg = round1((peso * pctGordura) / 100);
  const massaMagraKg = round1(peso - massaGordaKg);

  return {
    somaDobras: round1(soma),
    densidadeCorporal: Math.round(dc * 10000) / 10000,
    percentualGordura: round1(pctGordura),
    massaGordaKg,
    massaMagraKg,
  };
}

export interface ResultadoComposicaoBioimpedancia {
  percentualGordura: number;
  massaGordaKg: number;
  massaMagraKg: number;
}

export function calcularComposicaoPorBioimpedancia(params: {
  peso: number;
  percentualGordura?: number | null;
  massaGordaKg?: number | null;
  massaMagraKg?: number | null;
}): ResultadoComposicaoBioimpedancia | null {
  const { peso, percentualGordura, massaGordaKg, massaMagraKg } = params;
  if (!peso || peso <= 0 || Number.isNaN(peso)) return null;

  if (percentualGordura != null && percentualGordura > 0 && percentualGordura < 80) {
    const gorda =
      massaGordaKg != null && massaGordaKg >= 0
        ? round1(massaGordaKg)
        : round1((peso * percentualGordura) / 100);
    const magra =
      massaMagraKg != null && massaMagraKg > 0
        ? round1(massaMagraKg)
        : round1(Math.max(0, peso - gorda));

    return {
      percentualGordura: round1(percentualGordura),
      massaGordaKg: gorda,
      massaMagraKg: magra,
    };
  }

  if (massaMagraKg != null && massaMagraKg > 0 && massaMagraKg < peso) {
    const magra = round1(massaMagraKg);
    const gorda =
      massaGordaKg != null && massaGordaKg >= 0
        ? round1(massaGordaKg)
        : round1(peso - magra);
    const pct = round1((gorda / peso) * 100);
    return {
      percentualGordura: pct,
      massaGordaKg: gorda,
      massaMagraKg: magra,
    };
  }

  if (massaGordaKg != null && massaGordaKg > 0 && massaGordaKg < peso) {
    const gorda = round1(massaGordaKg);
    const magra = round1(peso - gorda);
    const pct = round1((gorda / peso) * 100);
    return {
      percentualGordura: pct,
      massaGordaKg: gorda,
      massaMagraKg: magra,
    };
  }

  return null;
}

export interface ClassificacaoPercentualGordura {
  label: string;
  badgeType: 'ok' | 'warn' | 'danger';
}

export function classificarPercentualGordura(
  percentual: number | null | undefined,
  sexo: 'MASCULINO' | 'FEMININO' | null | undefined,
  idade?: number | null,
): ClassificacaoPercentualGordura | null {
  if (percentual == null || Number.isNaN(percentual) || percentual <= 0 || !sexo) {
    return null;
  }

  const ajusteIdade = idade != null && idade >= 55 ? 4 : idade != null && idade >= 40 ? 2 : 0;

  if (sexo === 'MASCULINO') {
    if (percentual < 6) return { label: 'Essencial / Baixo', badgeType: 'warn' };
    if (percentual <= 12 + ajusteIdade) return { label: 'Excelente (Atleta)', badgeType: 'ok' };
    if (percentual <= 18 + ajusteIdade) return { label: 'Bom / Adequado', badgeType: 'ok' };
    if (percentual <= 24 + ajusteIdade) return { label: 'Moderado / Acima do ideal', badgeType: 'warn' };
    return { label: 'Elevado', badgeType: 'danger' };
  }

  if (percentual < 14) return { label: 'Essencial / Baixo', badgeType: 'warn' };
  if (percentual <= 20 + ajusteIdade) return { label: 'Excelente (Atleta)', badgeType: 'ok' };
  if (percentual <= 26 + ajusteIdade) return { label: 'Bom / Adequado', badgeType: 'ok' };
  if (percentual <= 32 + ajusteIdade) return { label: 'Moderado / Acima do ideal', badgeType: 'warn' };
  return { label: 'Elevado', badgeType: 'danger' };
}

export function formatarListaPortugues(itens: string[]): string {
  const limpos = itens.map((i) => i.trim()).filter(Boolean);
  if (limpos.length === 0) return '';
  if (limpos.length === 1) return limpos[0];
  if (limpos.length === 2) return `${limpos[0]} e ${limpos[1]}`;
  return `${limpos.slice(0, -1).join(', ')} e ${limpos[limpos.length - 1]}`;
}

export interface ProgressoAbaMedida {
  nome: string;
  preenchidos: number;
  total: number;
  percentual: number;
  faltantes: string[];
  textoFaltantes: string;
}

export interface ProgressoAvaliacaoResult {
  abas: {
    circunferencias: ProgressoAbaMedida;
    dobras: ProgressoAbaMedida;
    bioimpedancia: ProgressoAbaMedida;
  };
  totalPreenchidos: number;
  totalCampos: number;
  percentualTotal: number;
  nenhumCampoPreenchido: boolean;
  abasIncompletas: string[];
  textoAbasIncompletas: string;
}

const CAMPOS_CIRCUNFERENCIAS_PROGRESSO = [
  { key: 'peso', label: 'Peso' },
  { key: 'altura', label: 'Altura' },
  { key: 'cintura', label: 'Cintura' },
  { key: 'abdomen', label: 'Abdômen' },
  { key: 'quadril', label: 'Quadril' },
  { key: 'bracoDireito', label: 'Braço Dir.' },
  { key: 'bracoEsquerdo', label: 'Braço Esq.' },
  { key: 'coxaDireita', label: 'Coxa Dir.' },
  { key: 'coxaEsquerda', label: 'Coxa Esq.' },
  { key: 'culote', label: 'Culote' },
] as const;

const CAMPOS_DOBRAS_PROGRESSO = [
  { key: 'dobraPeitoral', label: 'Peitoral', p3M: true, p3F: false },
  { key: 'dobraAxilarMedia', label: 'Axilar Média', p3M: false, p3F: false },
  { key: 'dobraTriceps', label: 'Tríceps', p3M: false, p3F: true },
  { key: 'dobraSubescapular', label: 'Subescapular', p3M: false, p3F: false },
  { key: 'dobraAbdominal', label: 'Abdominal', p3M: true, p3F: false },
  { key: 'dobraSuprailiaca', label: 'Suprailíaca', p3M: false, p3F: true },
  { key: 'dobraCoxa', label: 'Coxa Medial', p3M: true, p3F: true },
] as const;

const CAMPOS_BIA_PROGRESSO = [
  { key: 'percentualGordura', label: '% Gordura Corporal' },
  { key: 'massaMagraKg', label: 'Massa Magra' },
  { key: 'massaGordaKg', label: 'Massa Gorda' },
  { key: 'massaMuscularKg', label: 'Massa Muscular Esq.' },
  { key: 'aguaCorporalPct', label: 'Água Corporal' },
  { key: 'gorduraVisceral', label: 'Gordura Visceral' },
  { key: 'taxaMetabolicaBia', label: 'TMB Aparelho BIA' },
  { key: 'idadeMetabolica', label: 'Idade Metabólica' },
] as const;

function campoTemValor(v: unknown): boolean {
  if (v === '' || v === null || v === undefined) return false;
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
}

function avaliarAba(
  nome: string,
  campos: ReadonlyArray<{ key: string; label: string }>,
  valores: Record<string, unknown>,
): ProgressoAbaMedida {
  const faltantes: string[] = [];
  let preenchidos = 0;
  for (const c of campos) {
    if (campoTemValor(valores[c.key])) {
      preenchidos++;
    } else {
      faltantes.push(c.label);
    }
  }
  const total = campos.length;
  const percentual = total > 0 ? Math.round((preenchidos / total) * 100) : 0;
  return {
    nome,
    preenchidos,
    total,
    percentual,
    faltantes,
    textoFaltantes: formatarListaPortugues(faltantes),
  };
}

export function calcularProgressoAvaliacao(
  valores: Record<string, unknown> | null | undefined,
  pollockModo: 'POLLOCK_3' | 'POLLOCK_7' = 'POLLOCK_3',
  sexo: 'MASCULINO' | 'FEMININO' = 'FEMININO',
): ProgressoAvaliacaoResult {
  const vals = valores || {};

  const dobrasAtivas =
    pollockModo === 'POLLOCK_7'
      ? CAMPOS_DOBRAS_PROGRESSO
      : CAMPOS_DOBRAS_PROGRESSO.filter((d) => (sexo === 'MASCULINO' ? d.p3M : d.p3F));

  const nomeDobras =
    pollockModo === 'POLLOCK_3'
      ? 'Dobras Cutâneas (Pollock 3)'
      : 'Dobras Cutâneas (Pollock 7)';

  const circunferencias = avaliarAba(
    'Peso e Circunferências',
    CAMPOS_CIRCUNFERENCIAS_PROGRESSO,
    vals,
  );
  const dobras = avaliarAba(nomeDobras, dobrasAtivas, vals);
  const bioimpedancia = avaliarAba('Bioimpedância (BIA)', CAMPOS_BIA_PROGRESSO, vals);

  const totalPreenchidos =
    circunferencias.preenchidos + dobras.preenchidos + bioimpedancia.preenchidos;
  const totalCampos = circunferencias.total + dobras.total + bioimpedancia.total;
  const percentualTotal =
    totalCampos > 0 ? Math.round((totalPreenchidos / totalCampos) * 100) : 0;

  const abasIncompletas = [circunferencias, dobras, bioimpedancia]
    .filter((a) => a.preenchidos < a.total)
    .map((a) => a.nome);

  return {
    abas: {
      circunferencias,
      dobras,
      bioimpedancia,
    },
    totalPreenchidos,
    totalCampos,
    percentualTotal,
    nenhumCampoPreenchido: totalPreenchidos === 0,
    abasIncompletas,
    textoAbasIncompletas: formatarListaPortugues(abasIncompletas),
  };
}

const REGRAS_LIMITES_MEDIDA: Record<
  string,
  { label: string; min: number; max: number; unidade?: string; inteiro?: boolean }
> = {
  peso: { label: 'Peso', min: 0.1, max: 500, unidade: 'kg' },
  altura: { label: 'Altura', min: 20, max: 280, unidade: 'cm' },
  cintura: { label: 'Cintura', min: 10, max: 300, unidade: 'cm' },
  abdomen: { label: 'Abdômen', min: 10, max: 300, unidade: 'cm' },
  quadril: { label: 'Quadril', min: 10, max: 300, unidade: 'cm' },
  bracoDireito: { label: 'Braço Direito', min: 5, max: 150, unidade: 'cm' },
  bracoEsquerdo: { label: 'Braço Esquerdo', min: 5, max: 150, unidade: 'cm' },
  coxaDireita: { label: 'Coxa Direita', min: 10, max: 200, unidade: 'cm' },
  coxaEsquerda: { label: 'Coxa Esquerda', min: 10, max: 200, unidade: 'cm' },
  culote: { label: 'Culote', min: 10, max: 300, unidade: 'cm' },
  dobraPeitoral: { label: 'Dobra Peitoral', min: 1, max: 150, unidade: 'mm' },
  dobraAxilarMedia: { label: 'Dobra Axilar Média', min: 1, max: 150, unidade: 'mm' },
  dobraTriceps: { label: 'Dobra Tríceps', min: 1, max: 150, unidade: 'mm' },
  dobraSubescapular: { label: 'Dobra Subescapular', min: 1, max: 150, unidade: 'mm' },
  dobraAbdominal: { label: 'Dobra Abdominal', min: 1, max: 150, unidade: 'mm' },
  dobraSuprailiaca: { label: 'Dobra Suprailíaca', min: 1, max: 150, unidade: 'mm' },
  dobraCoxa: { label: 'Dobra Coxa Medial', min: 1, max: 150, unidade: 'mm' },
  percentualGordura: { label: '% Gordura Corporal', min: 1, max: 75, unidade: '%' },
  massaMagraKg: { label: 'Massa Magra', min: 1, max: 300, unidade: 'kg' },
  massaGordaKg: { label: 'Massa Gorda', min: 0, max: 300, unidade: 'kg' },
  massaMuscularKg: { label: 'Massa Muscular Esq.', min: 1, max: 250, unidade: 'kg' },
  aguaCorporalPct: { label: 'Água Corporal', min: 10, max: 90, unidade: '%' },
  gorduraVisceral: { label: 'Gordura Visceral', min: 1, max: 60 },
  taxaMetabolicaBia: { label: 'TMB Aparelho BIA', min: 200, max: 10000, unidade: 'kcal' },
  idadeMetabolica: { label: 'Idade Metabólica', min: 5, max: 120, unidade: 'anos', inteiro: true },
};

export function validarValoresMedida(
  valores: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const erros: Record<string, string> = {};
  if (!valores) return erros;

  for (const [key, regra] of Object.entries(REGRAS_LIMITES_MEDIDA)) {
    const raw = valores[key];
    if (raw === '' || raw === null || raw === undefined) continue;
    const num = Number(raw);
    const sufixoMin = regra.unidade === '%' ? '%' : '';
    const sufixoMax = regra.unidade === '%' ? '%' : regra.unidade ? ` ${regra.unidade}` : '';

    if (!Number.isFinite(num)) {
      erros[key] = `${regra.label}: informe um número válido.`;
      continue;
    }
    if (num <= 0 && regra.min > 0) {
      erros[key] = `${regra.label}: deve ser maior que zero (entre ${regra.min}${sufixoMin} e ${regra.max}${sufixoMax}).`;
      continue;
    }
    if (regra.inteiro && !Number.isInteger(num)) {
      erros[key] = `${regra.label}: deve ser um número inteiro.`;
      continue;
    }
    if (num < regra.min || num > regra.max) {
      erros[key] = `${regra.label}: valor inválido (${num}). Deve estar entre ${regra.min}${sufixoMin} e ${regra.max}${sufixoMax}.`;
    }
  }

  return erros;
}

export function traduzirErrosApiMedida(
  apiErrors: Record<string, string[]> | undefined | null,
): Record<string, string> {
  const resultado: Record<string, string> = {};
  if (!apiErrors) return resultado;

  for (const [key, msgs] of Object.entries(apiErrors)) {
    const msg = msgs?.[0];
    if (!msg) continue;
    const regra = REGRAS_LIMITES_MEDIDA[key];
    if (!regra) {
      resultado[key] = msg;
      continue;
    }
    const sufixo = regra.unidade === '%' ? '%' : regra.unidade ? ` ${regra.unidade}` : '';
    if (
      msg.includes('less than or equal') ||
      msg.includes('greater than') ||
      msg.includes('Expected')
    ) {
      resultado[key] = `${regra.label}: deve estar entre ${regra.min}${sufixo} e ${regra.max}${sufixo}.`;
    } else {
      resultado[key] = msg.startsWith(regra.label) ? msg : `${regra.label}: ${msg}`;
    }
  }

  return resultado;
}

export type StatusReferenciaExame = 'ABAIXO' | 'NORMAL' | 'ACIMA' | 'INDETERMINADO';

export function avaliarResultadoExame(
  resultadoStr: string | null | undefined,
  valorMinimo: number | null | undefined,
  valorMaximo: number | null | undefined,
): StatusReferenciaExame {
  if (!resultadoStr || (valorMinimo == null && valorMaximo == null)) {
    return 'INDETERMINADO';
  }
  const match = resultadoStr.replace(',', '.').match(/-?\d+(\.\d+)?/);
  if (!match) return 'INDETERMINADO';
  const valor = parseFloat(match[0]);
  if (Number.isNaN(valor)) return 'INDETERMINADO';

  if (valorMinimo != null && valor < valorMinimo) return 'ABAIXO';
  if (valorMaximo != null && valor > valorMaximo) return 'ACIMA';
  return 'NORMAL';
}

// ============================================================================
// PRODUTIVIDADE NO PLANO ALIMENTAR (DUPLICAR PLANO E REFEIÇÕES PADRÃO)
// ============================================================================

export function duplicarPlanoParaInput(plano: {
  pacienteId?: string | null;
  titulo: string;
  objetivo?: any;
  metaCalorias?: number | null;
  metaProteinas?: number | null;
  metaCarboidratos?: number | null;
  metaGorduras?: number | null;
  recomendacaoAguaMl?: number | null;
  observacoes?: string | null;
  refeicoes: Array<{
    nome: string;
    horario: string;
    ordem: number;
    opcoes: Array<{
      nome?: string | null;
      ordem: number;
      alimentos: Array<{
        alimentoId?: string | null;
        medidaCaseiraId?: string | null;
        alimento: string;
        quantidade: number;
        unidade: string;
        calorias?: number | null;
        proteinas?: number | null;
        carboidratos?: number | null;
        gorduras?: number | null;
        observacao?: string | null;
      }>;
    }>;
  }>;
}): CreatePlanoAlimentarInput {
  return {
    pacienteId: plano.pacienteId ?? null,
    titulo: `${plano.titulo} (Cópia)`,
    objetivo: plano.objetivo || null,
    metaCalorias: plano.metaCalorias ?? null,
    metaProteinas: plano.metaProteinas ?? null,
    metaCarboidratos: plano.metaCarboidratos ?? null,
    metaGorduras: plano.metaGorduras ?? null,
    recomendacaoAguaMl: plano.recomendacaoAguaMl ?? null,
    observacoes: plano.observacoes ?? null,
    refeicoes: plano.refeicoes.map((r, rIdx) => ({
      nome: r.nome,
      horario: r.horario,
      ordem: r.ordem ?? rIdx,
      opcoes: r.opcoes.map((o, oIdx) => ({
        nome: o.nome ?? null,
        ordem: o.ordem ?? oIdx,
        alimentos: o.alimentos.map((a) => ({
          alimentoId: a.alimentoId ?? null,
          medidaCaseiraId: a.medidaCaseiraId ?? null,
          alimento: a.alimento,
          quantidade: a.quantidade,
          unidade: a.unidade,
          calorias: a.calorias ?? null,
          proteinas: a.proteinas ?? null,
          carboidratos: a.carboidratos ?? null,
          gorduras: a.gorduras ?? null,
          observacao: a.observacao ?? null,
        })),
      })),
    })),
  };
}

export function gerarRefeicoesPadrao(): Array<{
  nome: string;
  horario: string;
  ordem: number;
}> {
  return [
    { nome: 'Café da Manhã', horario: '07:30', ordem: 0 },
    { nome: 'Lanche da Manhã', horario: '10:00', ordem: 1 },
    { nome: 'Almoço', horario: '12:30', ordem: 2 },
    { nome: 'Lanche da Tarde', horario: '16:00', ordem: 3 },
    { nome: 'Jantar', horario: '19:30', ordem: 4 },
  ];
}

export function converterPlanoParaModeloInput(
  plano: {
    pacienteId?: string | null;
    titulo: string;
    objetivo?: any;
    metaCalorias?: number | null;
    metaProteinas?: number | null;
    metaCarboidratos?: number | null;
    metaGorduras?: number | null;
    recomendacaoAguaMl?: number | null;
    observacoes?: string | null;
    refeicoes: Array<any>;
  },
  tituloModelo?: string,
): CreatePlanoAlimentarInput {
  const base = duplicarPlanoParaInput({
    ...plano,
    pacienteId: plano.pacienteId || '00000000-0000-0000-0000-000000000000',
  });
  return {
    ...base,
    pacienteId: null,
    isTemplate: true,
    titulo: tituloModelo?.trim() || plano.titulo,
  };
}

// ============================================================================
// SUBSTITUIÇÃO INTELIGENTE DE ALIMENTOS POR EQUIVALÊNCIA NUTRICIONAL
// ============================================================================

export type CriterioEquivalencia = 'CALORIAS' | 'CARBOIDRATOS' | 'PROTEINAS' | 'GORDURAS';

export function detectarCriterioEquivalenciaDominante(alimento: {
  calorias?: number | null;
  proteinas?: number | null;
  carboidratos?: number | null;
  gorduras?: number | null;
}): CriterioEquivalencia {
  const prot = alimento.proteinas ?? 0;
  const carb = alimento.carboidratos ?? 0;
  const gord = alimento.gorduras ?? 0;

  const kcalProt = prot * 4;
  const kcalCarb = carb * 4;
  const kcalGord = gord * 9;
  const totalMacroKcal = kcalProt + kcalCarb + kcalGord;

  if (totalMacroKcal <= 0) return 'CALORIAS';

  if (kcalCarb >= kcalProt && kcalCarb >= kcalGord && carb >= 4 && kcalCarb / totalMacroKcal >= 0.4) {
    return 'CARBOIDRATOS';
  }
  if (kcalProt >= kcalCarb && kcalProt >= kcalGord && prot >= 4 && kcalProt / totalMacroKcal >= 0.4) {
    return 'PROTEINAS';
  }
  if (kcalGord >= kcalCarb && kcalGord >= kcalProt && gord >= 4 && kcalGord / totalMacroKcal >= 0.4) {
    return 'GORDURAS';
  }

  return 'CALORIAS';
}

export interface ResultadoSubstituicaoEquivalente {
  alimentoCalculado: AlimentoCalculavel;
  gramasEquivalentes: number;
  criterioUsado: CriterioEquivalencia;
  diferencaKcal: number;
  sugestaoMedidaCaseira: {
    id: string;
    nome: string;
    quantidadeUnidades: number;
    quantidadeEmGramas: number;
  } | null;
}

export function calcularSubstituicaoEquivalente(
  origem: {
    calorias?: number | null;
    proteinas?: number | null;
    carboidratos?: number | null;
    gorduras?: number | null;
  },
  substitutoApi: {
    id: string;
    nome: string;
    calorias?: number | null;
    proteinas?: number | null;
    carboidratos?: number | null;
    gorduras?: number | null;
    fibra?: number | null;
    medidasCaseiras?: MedidaCaseiraSimples[] | null;
  },
  criterio: CriterioEquivalencia,
  uidStr: string,
): ResultadoSubstituicaoEquivalente | null {
  const obterPar = (crit: CriterioEquivalencia): { alvo: number; base100: number } => {
    if (crit === 'CARBOIDRATOS') {
      return { alvo: origem.carboidratos ?? 0, base100: substitutoApi.carboidratos ?? 0 };
    }
    if (crit === 'PROTEINAS') {
      return { alvo: origem.proteinas ?? 0, base100: substitutoApi.proteinas ?? 0 };
    }
    if (crit === 'GORDURAS') {
      return { alvo: origem.gorduras ?? 0, base100: substitutoApi.gorduras ?? 0 };
    }
    return { alvo: origem.calorias ?? 0, base100: substitutoApi.calorias ?? 0 };
  };

  let criterioUsado: CriterioEquivalencia = criterio;
  let { alvo, base100 } = obterPar(criterio);

  if (alvo <= 0 || base100 <= 0) {
    const fallbackCal = obterPar('CALORIAS');
    if (fallbackCal.alvo > 0 && fallbackCal.base100 > 0) {
      criterioUsado = 'CALORIAS';
      alvo = fallbackCal.alvo;
      base100 = fallbackCal.base100;
    } else {
      return null;
    }
  }

  const gramasRaw = (alvo / base100) * 100;
  const gramasEquivalentes = round1(Math.max(5, Math.min(1500, gramasRaw)));

  const inicial = criarAlimentoInicial(substitutoApi, uidStr);
  const emGramas: AlimentoCalculavel = {
    ...inicial,
    medidaCaseiraId: null,
    unidade: 'g',
    quantidade: 100,
  };
  const alimentoCalculado = recalcularAlimentoPlano(emGramas, 'quantidade', gramasEquivalentes);

  let sugestaoMedidaCaseira: ResultadoSubstituicaoEquivalente['sugestaoMedidaCaseira'] = null;
  const mcCandidata = inicial._medidasCaseiras.find(
    (m) => m.quantidadeEmGramas > 1 && m.nome.trim().toLowerCase() !== 'ml',
  );
  if (mcCandidata) {
    const unidadesRaw = gramasEquivalentes / mcCandidata.quantidadeEmGramas;
    const quantidadeUnidades = Math.max(0.5, Math.round(unidadesRaw * 2) / 2);
    sugestaoMedidaCaseira = {
      id: mcCandidata.id,
      nome: mcCandidata.nome,
      quantidadeUnidades,
      quantidadeEmGramas: mcCandidata.quantidadeEmGramas,
    };
  }

  const diferencaKcal = Math.round((alimentoCalculado.calorias ?? 0) - (origem.calorias ?? 0));

  return {
    alimentoCalculado,
    gramasEquivalentes,
    criterioUsado,
    diferencaKcal,
    sugestaoMedidaCaseira,
  };
}

// ============================================================================
// EVOLUÇÃO ANTROPOMÉTRICA (SÉRIE TEMPORAL PARA GRÁFICOS)
// ============================================================================

export interface PontoEvolucaoAntropometrica {
  id: string;
  dataIso: string;
  dataLabel: string;
  peso: number | null;
  imc: number | null;
  percentualGordura: number | null;
  massaMagraKg: number | null;
  massaGordaKg: number | null;
  cintura: number | null;
  abdomen: number | null;
  quadril: number | null;
}

export interface SerieEvolucaoAntropometrica {
  pontos: PontoEvolucaoAntropometrica[];
  variacoes: {
    peso: number | null;
    imc: number | null;
    percentualGordura: number | null;
    massaMagraKg: number | null;
    cintura: number | null;
  };
}

function diffMetrica(
  pontos: PontoEvolucaoAntropometrica[],
  key: keyof Pick<
    PontoEvolucaoAntropometrica,
    'peso' | 'imc' | 'percentualGordura' | 'massaMagraKg' | 'cintura'
  >,
): number | null {
  const validos = pontos.map((p) => p[key]).filter((v): v is number => typeof v === 'number');
  if (validos.length < 2) return null;
  return round1(validos[validos.length - 1] - validos[0]);
}

export function prepararSerieEvolucaoAntropometrica(
  medidas: Array<Record<string, any>>,
): SerieEvolucaoAntropometrica {
  const ordenadas = [...(medidas || [])].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
  );

  const pontos: PontoEvolucaoAntropometrica[] = ordenadas.map((m) => {
    const imcRaw = calcularIMC(m.peso, m.altura);
    return {
      id: m.id,
      dataIso: m.data,
      dataLabel: new Date(m.data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        timeZone: 'UTC',
      }),
      peso: typeof m.peso === 'number' ? m.peso : null,
      imc: imcRaw !== null ? round1(imcRaw) : null,
      percentualGordura: typeof m.percentualGordura === 'number' ? m.percentualGordura : null,
      massaMagraKg: typeof m.massaMagraKg === 'number' ? m.massaMagraKg : null,
      massaGordaKg: typeof m.massaGordaKg === 'number' ? m.massaGordaKg : null,
      cintura: typeof m.cintura === 'number' ? m.cintura : null,
      abdomen: typeof m.abdomen === 'number' ? m.abdomen : null,
      quadril: typeof m.quadril === 'number' ? m.quadril : null,
    };
  });

  return {
    pontos,
    variacoes: {
      peso: diffMetrica(pontos, 'peso'),
      imc: diffMetrica(pontos, 'imc'),
      percentualGordura: diffMetrica(pontos, 'percentualGordura'),
      massaMagraKg: diffMetrica(pontos, 'massaMagraKg'),
      cintura: diffMetrica(pontos, 'cintura'),
    },
  };
}
