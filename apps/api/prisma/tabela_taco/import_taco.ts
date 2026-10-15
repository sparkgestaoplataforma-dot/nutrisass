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

export async function importarTabelaTaco() {
  console.log('--------------------------------------------------');
  console.log('Iniciando importação da Tabela TACO...');
  console.log('--------------------------------------------------');

  const jsonPath = path.join(__dirname, 'alimentos.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo alimentos.json não encontrado em: ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const tacoItems: TacoItem[] = JSON.parse(rawData);
  console.log(`Carregados ${tacoItems.length} alimentos do arquivo alimentos.json.`);

  // 1. Busca todos os alimentos globais já existentes
  const existentes = await prisma.alimento.findMany({
    where: { clinicaId: null },
    select: { nome: true },
  });
  const existentesNomes = new Set(existentes.map((e) => e.nome.toLowerCase().trim()));
  console.log(`Alimentos globais já existentes no banco: ${existentes.length}`);

  // 2. Filtra apenas os que não existem
  const novosParaInserir = tacoItems
    .filter((item) => !existentesNomes.has(item.nome.toLowerCase().trim()))
    .map((item) => ({
      nome: item.nome.trim(),
      grupo: item.grupo ? item.grupo.trim() : null,
      calorias: item.calorias ?? 0,
      proteinas: item.proteinas ?? 0,
      carboidratos: item.carboidratos ?? 0,
      gorduras: item.gorduras ?? 0,
      fibra: item.fibra ?? 0,
      clinicaId: null,
    }));

  if (novosParaInserir.length > 0) {
    console.log(`Inserindo ${novosParaInserir.length} novos alimentos em lote...`);
    await prisma.alimento.createMany({
      data: novosParaInserir,
      skipDuplicates: true,
    });
    console.log(`✓ ${novosParaInserir.length} alimentos inseridos com sucesso!`);
  } else {
    console.log('Todos os alimentos do arquivo já estavam cadastrados no banco.');
  }

  // 3. Adiciona medidas caseiras inteligentes
  console.log('\nSemeando medidas caseiras para os alimentos...');
  const todosAlimentos = await prisma.alimento.findMany({
    where: { clinicaId: null },
    include: {
      medidasCaseiras: { select: { nome: true } },
    },
  });

  let totalMedidasCriadas = 0;
  const medidasParaCriar: { alimentoId: string; nome: string; quantidadeEmGramas: number }[] = [];

  for (const alimento of todosAlimentos) {
    const nomeLower = alimento.nome.toLowerCase();
    const grupoLower = (alimento.grupo || '').toLowerCase();
    const medidasAtuais = new Set(alimento.medidasCaseiras.map((m) => m.nome.toLowerCase()));

    // Sempre garante a medida base de 100g e gramas se não houver
    if (!medidasAtuais.has('porção (100g)') && !medidasAtuais.has('100g')) {
      medidasParaCriar.push({
        alimentoId: alimento.id,
        nome: 'Porção (100g)',
        quantidadeEmGramas: 100,
      });
      medidasAtuais.add('porção (100g)');
      totalMedidasCriadas++;
    }

    if (!medidasAtuais.has('g') && !medidasAtuais.has('grama')) {
      medidasParaCriar.push({
        alimentoId: alimento.id,
        nome: 'g',
        quantidadeEmGramas: 1,
      });
      medidasAtuais.add('g');
      totalMedidasCriadas++;
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
        if (!medidasAtuais.has(med.nome.toLowerCase())) {
          medidasParaCriar.push({
            alimentoId: alimento.id,
            nome: med.nome,
            quantidadeEmGramas: med.quantidadeEmGramas,
          });
          medidasAtuais.add(med.nome.toLowerCase());
          totalMedidasCriadas++;
        }
      }
    }

    // Medidas comuns por categoria (arroz, feijao, frango, carne, ovo, fruta, pao)
    for (const [chave, medidas] of Object.entries(MEDIDAS_COMUNS)) {
      if (nomeLower.includes(chave)) {
        for (const med of medidas) {
          if (!medidasAtuais.has(med.nome.toLowerCase())) {
            medidasParaCriar.push({
              alimentoId: alimento.id,
              nome: med.nome,
              quantidadeEmGramas: med.quantidadeEmGramas,
            });
            medidasAtuais.add(med.nome.toLowerCase());
            totalMedidasCriadas++;
          }
        }
      }
    }
  }

  if (medidasParaCriar.length > 0) {
    console.log(`Cadastrando ${medidasParaCriar.length} medidas caseiras em lote...`);
    // Insere em lotes de 1000 para evitar limites do PG
    const batchSize = 1000;
    for (let i = 0; i < medidasParaCriar.length; i += batchSize) {
      const batch = medidasParaCriar.slice(i, i + batchSize);
      await prisma.medidaCaseira.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
    console.log(`✓ ${totalMedidasCriadas} medidas caseiras criadas com sucesso!`);
  }

  // 4. Verificação final
  const totalAlimentosNoBanco = await prisma.alimento.count({ where: { clinicaId: null } });
  const totalMedidasNoBanco = await prisma.medidaCaseira.count({
    where: { alimento: { clinicaId: null } },
  });

  console.log('--------------------------------------------------');
  console.log(`Importação concluída com sucesso!`);
  console.log(`Total de Alimentos TACO cadastrados: ${totalAlimentosNoBanco}`);
  console.log(`Total de Medidas Caseiras vinculadas: ${totalMedidasNoBanco}`);
  console.log('--------------------------------------------------');
}

// Executa se chamado diretamente via CLI
importarTabelaTaco()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Erro na importação da Tabela TACO:', err);
    process.exit(1);
  });
