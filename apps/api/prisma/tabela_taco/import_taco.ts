import { prisma } from '../../src/shared/providers/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TacoItem {
  nome: string;
  grupo: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  fibra: number;
}

const MEDIDAS_COMUNS: Record<string, { nome: string; quantidadeEmGramas: number }[]> = {
  arroz: [
    { nome: 'Colher de sopa cheia', quantidadeEmGramas: 25 },
    { nome: 'Colher de arroz', quantidadeEmGramas: 45 },
    { nome: 'Escumadeira cheia', quantidadeEmGramas: 80 },
    { nome: 'Xícara (chá)', quantidadeEmGramas: 160 },
  ],
  feijao: [
    { nome: 'Concha média cheia', quantidadeEmGramas: 86 },
    { nome: 'Concha pequena', quantidadeEmGramas: 55 },
    { nome: 'Colher de sopa cheia', quantidadeEmGramas: 17 },
  ],
  feijão: [
    { nome: 'Concha média cheia', quantidadeEmGramas: 86 },
    { nome: 'Concha pequena', quantidadeEmGramas: 55 },
    { nome: 'Colher de sopa cheia', quantidadeEmGramas: 17 },
  ],
  frango: [
    { nome: 'Filé pequeno', quantidadeEmGramas: 80 },
    { nome: 'Filé médio', quantidadeEmGramas: 120 },
    { nome: 'Filé grande', quantidadeEmGramas: 160 },
    { nome: 'Pedaço médio', quantidadeEmGramas: 100 },
  ],
  carne: [
    { nome: 'Bife pequeno', quantidadeEmGramas: 80 },
    { nome: 'Bife médio', quantidadeEmGramas: 120 },
    { nome: 'Colher de sopa (moída)', quantidadeEmGramas: 25 },
    { nome: 'Pedaço médio', quantidadeEmGramas: 100 },
  ],
  peixe: [
    { nome: 'Filé pequeno', quantidadeEmGramas: 90 },
    { nome: 'Filé médio', quantidadeEmGramas: 130 },
    { nome: 'Posta média', quantidadeEmGramas: 120 },
  ],
  ovo: [
    { nome: 'Unidade pequena', quantidadeEmGramas: 45 },
    { nome: 'Unidade média', quantidadeEmGramas: 50 },
    { nome: 'Unidade grande', quantidadeEmGramas: 60 },
  ],
  banana: [
    { nome: 'Unidade pequena', quantidadeEmGramas: 50 },
    { nome: 'Unidade média', quantidadeEmGramas: 70 },
    { nome: 'Unidade grande', quantidadeEmGramas: 100 },
  ],
  maçã: [
    { nome: 'Unidade pequena', quantidadeEmGramas: 90 },
    { nome: 'Unidade média', quantidadeEmGramas: 130 },
  ],
  maca: [
    { nome: 'Unidade pequena', quantidadeEmGramas: 90 },
    { nome: 'Unidade média', quantidadeEmGramas: 130 },
  ],
  pão: [
    { nome: 'Fatia', quantidadeEmGramas: 25 },
    { nome: 'Unidade', quantidadeEmGramas: 50 },
  ],
  pao: [
    { nome: 'Fatia', quantidadeEmGramas: 25 },
    { nome: 'Unidade', quantidadeEmGramas: 50 },
  ],
  aveia: [
    { nome: 'Colher de sopa', quantidadeEmGramas: 15 },
    { nome: 'Colher de chá', quantidadeEmGramas: 5 },
    { nome: 'Xícara (chá)', quantidadeEmGramas: 80 },
  ],
  azeite: [
    { nome: 'Colher de sopa', quantidadeEmGramas: 13 },
    { nome: 'Colher de sobremesa', quantidadeEmGramas: 8 },
    { nome: 'Colher de chá', quantidadeEmGramas: 4 },
  ],
  queijo: [
    { nome: 'Fatia fina', quantidadeEmGramas: 15 },
    { nome: 'Fatia média', quantidadeEmGramas: 30 },
    { nome: 'Colher de sopa (ralado)', quantidadeEmGramas: 10 },
  ],
};

const LIQUID_TERMS = [
  'suco',
  'bebida',
  'leite',
  'refrigerante',
  'café',
  'cafe',
  'chá',
  'cha',
  'cerveja',
  'vinho',
  'caldo',
  'água',
  'agua',
  'iogurte',
];

const MEDIDAS_LIQUIDAS = [
  { nome: 'ml', quantidadeEmGramas: 1 },
  { nome: 'Colher de sopa (15ml)', quantidadeEmGramas: 15 },
  { nome: 'Copo pequeno (150ml)', quantidadeEmGramas: 150 },
  { nome: 'Copo (200ml)', quantidadeEmGramas: 200 },
  { nome: 'Xícara (240ml)', quantidadeEmGramas: 240 },
  { nome: 'Copo grande (300ml)', quantidadeEmGramas: 300 },
  { nome: 'Lata (350ml)', quantidadeEmGramas: 350 },
  { nome: 'Garrafa (500ml)', quantidadeEmGramas: 500 },
  { nome: 'Litro (1000ml)', quantidadeEmGramas: 1000 },
];

function diferencaNumerica(v1: number | null | undefined, v2: number | null | undefined): boolean {
  const n1 = typeof v1 === 'number' ? v1 : Number(v1) || 0;
  const n2 = typeof v2 === 'number' ? v2 : Number(v2) || 0;
  return Math.abs(n1 - n2) > 0.0001;
}

function diferencaTexto(s1: string | null | undefined, s2: string | null | undefined): boolean {
  const t1 = (s1 ?? '').trim();
  const t2 = (s2 ?? '').trim();
  return t1 !== t2;
}

export async function importarTabelaTaco() {
  console.log('--------------------------------------------------');
  console.log('Iniciando sincronização da Tabela TACO...');
  console.log('--------------------------------------------------');

  const jsonPath = path.join(__dirname, 'alimentos.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo alimentos.json não encontrado em: ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const tacoItems: TacoItem[] = JSON.parse(rawData);
  console.log(`Carregados ${tacoItems.length} alimentos do arquivo alimentos.json.`);

  // 1. Busca todos os alimentos globais já existentes com seus valores atuais
  const existentes = await prisma.alimento.findMany({
    where: { clinicaId: null },
    select: {
      id: true,
      nome: true,
      grupo: true,
      calorias: true,
      proteinas: true,
      carboidratos: true,
      gorduras: true,
      fibra: true,
    },
  });

  const existentesMap = new Map<string, (typeof existentes)[0]>();
  for (const item of existentes) {
    const chave = item.nome.toLowerCase().trim();
    if (!existentesMap.has(chave)) {
      existentesMap.set(chave, item);
    }
  }
  console.log(`Alimentos globais já existentes no banco: ${existentes.length}`);

  // 2. Classifica em: novos (insert), divergentes (update) e inalterados
  const novosParaInserir: {
    nome: string;
    grupo: string | null;
    calorias: number;
    proteinas: number;
    carboidratos: number;
    gorduras: number;
    fibra: number;
    clinicaId: null;
  }[] = [];

  const itensParaAtualizar: {
    id: string;
    data: {
      nome: string;
      grupo: string | null;
      calorias: number;
      proteinas: number;
      carboidratos: number;
      gorduras: number;
      fibra: number;
    };
    alteracoes: string[];
  }[] = [];

  let totalIguais = 0;

  for (const item of tacoItems) {
    const nomeNormalizado = item.nome.toLowerCase().trim();
    const existente = existentesMap.get(nomeNormalizado);

    const nomeFormatado = item.nome.trim();
    const grupoFormatado = item.grupo ? item.grupo.trim() : null;
    const caloriasFormatada = typeof item.calorias === 'number' ? item.calorias : Number(item.calorias) || 0;
    const proteinasFormatada = typeof item.proteinas === 'number' ? item.proteinas : Number(item.proteinas) || 0;
    const carboidratosFormatada = typeof item.carboidratos === 'number' ? item.carboidratos : Number(item.carboidratos) || 0;
    const gordurasFormatada = typeof item.gorduras === 'number' ? item.gorduras : Number(item.gorduras) || 0;
    const fibraFormatada = typeof item.fibra === 'number' ? item.fibra : Number(item.fibra) || 0;

    if (!existente) {
      novosParaInserir.push({
        nome: nomeFormatado,
        grupo: grupoFormatado,
        calorias: caloriasFormatada,
        proteinas: proteinasFormatada,
        carboidratos: carboidratosFormatada,
        gorduras: gordurasFormatada,
        fibra: fibraFormatada,
        clinicaId: null,
      });
    } else {
      const alteracoes: string[] = [];

      if (diferencaTexto(nomeFormatado, existente.nome)) {
        alteracoes.push(`nome: "${existente.nome}" -> "${nomeFormatado}"`);
      }
      if (diferencaTexto(grupoFormatado, existente.grupo)) {
        alteracoes.push(`grupo: "${existente.grupo ?? ''}" -> "${grupoFormatado ?? ''}"`);
      }
      if (diferencaNumerica(caloriasFormatada, existente.calorias)) {
        alteracoes.push(`calorias: ${existente.calorias} -> ${caloriasFormatada}`);
      }
      if (diferencaNumerica(proteinasFormatada, existente.proteinas)) {
        alteracoes.push(`proteínas: ${existente.proteinas} -> ${proteinasFormatada}`);
      }
      if (diferencaNumerica(carboidratosFormatada, existente.carboidratos)) {
        alteracoes.push(`carboidratos: ${existente.carboidratos} -> ${carboidratosFormatada}`);
      }
      if (diferencaNumerica(gordurasFormatada, existente.gorduras)) {
        alteracoes.push(`gorduras: ${existente.gorduras} -> ${gordurasFormatada}`);
      }
      if (diferencaNumerica(fibraFormatada, existente.fibra)) {
        alteracoes.push(`fibra: ${existente.fibra} -> ${fibraFormatada}`);
      }

      if (alteracoes.length > 0) {
        itensParaAtualizar.push({
          id: existente.id,
          data: {
            nome: nomeFormatado,
            grupo: grupoFormatado,
            calorias: caloriasFormatada,
            proteinas: proteinasFormatada,
            carboidratos: carboidratosFormatada,
            gorduras: gordurasFormatada,
            fibra: fibraFormatada,
          },
          alteracoes,
        });
      } else {
        totalIguais++;
      }
    }
  }

  // Realiza inserção dos novos alimentos
  if (novosParaInserir.length > 0) {
    console.log(`Inserindo ${novosParaInserir.length} novos alimentos em lote...`);
    await prisma.alimento.createMany({
      data: novosParaInserir,
      skipDuplicates: true,
    });
    console.log(`✓ ${novosParaInserir.length} novos alimentos inseridos com sucesso!`);
  } else {
    console.log('Nenhum alimento novo para inserir.');
  }

  // Realiza update dos alimentos existentes que divergiram do JSON
  if (itensParaAtualizar.length > 0) {
    console.log(`Atualizando ${itensParaAtualizar.length} alimentos com divergências em relação ao JSON...`);
    const updateBatchSize = 100;
    for (let i = 0; i < itensParaAtualizar.length; i += updateBatchSize) {
      const batch = itensParaAtualizar.slice(i, i + updateBatchSize);
      await prisma.$transaction(
        batch.map(({ id, data }) =>
          prisma.alimento.update({
            where: { id },
            data,
          })
        )
      );
    }
    console.log(`✓ ${itensParaAtualizar.length} alimentos atualizados com sucesso!`);
  } else {
    console.log(`Todos os ${totalIguais} alimentos já cadastrados estão idênticos ao JSON.`);
  }

  // 3. Adiciona e sincroniza medidas caseiras inteligentes
  console.log('\nSemeando/sincronizando medidas caseiras para os alimentos...');
  const todosAlimentos = await prisma.alimento.findMany({
    where: { clinicaId: null },
    include: {
      medidasCaseiras: {
        select: { id: true, nome: true, quantidadeEmGramas: true },
      },
    },
  });

  let totalMedidasCriadas = 0;
  let totalMedidasAtualizadas = 0;
  const medidasParaCriar: { alimentoId: string; nome: string; quantidadeEmGramas: number }[] = [];
  const medidasParaAtualizar: { id: string; quantidadeEmGramas: number }[] = [];

  for (const alimento of todosAlimentos) {
    const nomeLower = alimento.nome.toLowerCase();
    const grupoLower = (alimento.grupo || '').toLowerCase();

    // Mapeia medidas existentes por nome normalizado
    const mapaMedidas = new Map(
      alimento.medidasCaseiras.map((m) => [m.nome.toLowerCase().trim(), m])
    );
    const medidasProcessadasNesteAlimento = new Set<string>();

    function registrarMedida(nome: string, quantidadeEmGramas: number) {
      const nomeKey = nome.toLowerCase().trim();
      if (medidasProcessadasNesteAlimento.has(nomeKey)) {
        return;
      }
      medidasProcessadasNesteAlimento.add(nomeKey);

      const existente = mapaMedidas.get(nomeKey);
      if (!existente) {
        medidasParaCriar.push({
          alimentoId: alimento.id,
          nome,
          quantidadeEmGramas,
        });
        mapaMedidas.set(nomeKey, { id: '', nome, quantidadeEmGramas });
        totalMedidasCriadas++;
      } else if (diferencaNumerica(existente.quantidadeEmGramas, quantidadeEmGramas)) {
        medidasParaAtualizar.push({
          id: existente.id,
          quantidadeEmGramas,
        });
        existente.quantidadeEmGramas = quantidadeEmGramas;
        totalMedidasAtualizadas++;
      }
    }

    // Sempre garante a medida base de 100g e 1g se não houver
    if (!mapaMedidas.has('porção (100g)') && !mapaMedidas.has('100g')) {
      registrarMedida('Porção (100g)', 100);
    }

    if (!mapaMedidas.has('g') && !mapaMedidas.has('grama')) {
      registrarMedida('g', 1);
    }

    // Medidas para líquidos
    const isLiquid =
      grupoLower.includes('bebidas') ||
      LIQUID_TERMS.some(
        (term) =>
          nomeLower.includes(term) &&
          !nomeLower.includes('pó') &&
          !nomeLower.includes('condensado') &&
          !nomeLower.includes('farinha')
      );

    if (isLiquid) {
      for (const med of MEDIDAS_LIQUIDAS) {
        registrarMedida(med.nome, med.quantidadeEmGramas);
      }
    }

    // Medidas comuns por categoria (arroz, feijao, frango, carne, ovo, fruta, pao)
    for (const [chave, medidas] of Object.entries(MEDIDAS_COMUNS)) {
      if (nomeLower.includes(chave)) {
        for (const med of medidas) {
          registrarMedida(med.nome, med.quantidadeEmGramas);
        }
      }
    }
  }

  if (medidasParaCriar.length > 0) {
    console.log(`Cadastrando ${medidasParaCriar.length} novas medidas caseiras em lote...`);
    const batchSize = 1000;
    for (let i = 0; i < medidasParaCriar.length; i += batchSize) {
      const batch = medidasParaCriar.slice(i, i + batchSize);
      await prisma.medidaCaseira.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
    console.log(`✓ ${totalMedidasCriadas} novas medidas caseiras criadas com sucesso!`);
  }

  if (medidasParaAtualizar.length > 0) {
    console.log(`Atualizando ${medidasParaAtualizar.length} medidas caseiras com divergências...`);
    const batchSize = 100;
    for (let i = 0; i < medidasParaAtualizar.length; i += batchSize) {
      const batch = medidasParaAtualizar.slice(i, i + batchSize);
      await prisma.$transaction(
        batch.map(({ id, quantidadeEmGramas }) =>
          prisma.medidaCaseira.update({
            where: { id },
            data: { quantidadeEmGramas },
          })
        )
      );
    }
    console.log(`✓ ${totalMedidasAtualizadas} medidas caseiras atualizadas com sucesso!`);
  }

  // 4. Verificação final
  const totalAlimentosNoBanco = await prisma.alimento.count({ where: { clinicaId: null } });
  const totalMedidasNoBanco = await prisma.medidaCaseira.count({
    where: { alimento: { clinicaId: null } },
  });

  console.log('--------------------------------------------------');
  console.log('Importação concluída com sucesso!');
  console.log(`Total de Alimentos TACO cadastrados: ${totalAlimentosNoBanco}`);
  console.log(`- Inseridos: ${novosParaInserir.length}`);
  console.log(`- Atualizados: ${itensParaAtualizar.length}`);
  console.log(`- Inalterados: ${totalIguais}`);
  console.log(`Total de Medidas Caseiras vinculadas: ${totalMedidasNoBanco}`);
  console.log(`- Novas medidas: ${totalMedidasCriadas}`);
  console.log(`- Medidas atualizadas: ${totalMedidasAtualizadas}`);
  console.log('--------------------------------------------------');
}

// Executa se chamado diretamente via CLI
const isDirectExecution =
  !process.argv[1] ||
  process.argv[1].endsWith('import_taco.ts') ||
  process.argv[1].endsWith('import_taco.js');

if (isDirectExecution) {
  importarTabelaTaco()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Erro na importação da Tabela TACO:', err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
