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
  pacienteId: string;
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
    pacienteId: plano.pacienteId,
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
