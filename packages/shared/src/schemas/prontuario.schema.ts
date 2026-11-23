import { z } from 'zod';

export const createEvolucaoSchema = z.object({
  pacienteId: z.string().uuid(),
  estadoClinico: z.string().optional(),
  aparelhoDigestivo: z.string().optional(),
  antecedentesMorbidos: z.string().optional(),
  medicamentos: z.string().optional(),
  outros: z.string().optional(),
});

export type CreateEvolucaoInput = z.infer<typeof createEvolucaoSchema>;

const positiveOptional = (label: string, max = 500) =>
  z
    .number({ invalid_type_error: `${label} deve ser um número válido` })
    .positive(`${label} deve ser maior que zero`)
    .max(max, `${label} deve ser no máximo ${max}`)
    .nullable()
    .optional();

export const protocoloComposicaoEnum = z.enum([
  'POLLOCK_3',
  'POLLOCK_7',
  'BIOIMPEDANCIA',
  'MANUAL',
]);

export type ProtocoloComposicao = z.infer<typeof protocoloComposicaoEnum>;

export const createMedidaSchema = z.object({
  pacienteId: z.string().uuid(),
  data: z.string().min(1, 'Data da avaliação é obrigatória'),
  peso: positiveOptional('Peso', 500),
  altura: positiveOptional('Altura', 280),
  cintura: positiveOptional('Cintura', 300),
  abdomen: positiveOptional('Abdômen', 300),
  quadril: positiveOptional('Quadril', 300),
  bracoDireito: positiveOptional('Braço Direito', 150),
  bracoEsquerdo: positiveOptional('Braço Esquerdo', 150),
  coxaDireita: positiveOptional('Coxa Direita', 200),
  coxaEsquerda: positiveOptional('Coxa Esquerda', 200),
  culote: positiveOptional('Culote', 300),
  protocoloComposicao: protocoloComposicaoEnum.nullable().optional(),
  dobraTriceps: positiveOptional('Dobra Tríceps', 150),
  dobraSubescapular: positiveOptional('Dobra Subescapular', 150),
  dobraPeitoral: positiveOptional('Dobra Peitoral', 150),
  dobraAxilarMedia: positiveOptional('Dobra Axilar Média', 150),
  dobraSuprailiaca: positiveOptional('Dobra Suprailíaca', 150),
  dobraAbdominal: positiveOptional('Dobra Abdominal', 150),
  dobraCoxa: positiveOptional('Dobra Coxa Medial', 150),
  percentualGordura: z
    .number({ invalid_type_error: '% de Gordura deve ser um número válido' })
    .min(1, '% de Gordura deve ser de no mínimo 1%')
    .max(75, '% de Gordura deve ser de no máximo 75%')
    .nullable()
    .optional(),
  massaMagraKg: positiveOptional('Massa Magra', 300),
  massaGordaKg: z
    .number({ invalid_type_error: 'Massa Gorda deve ser um número válido' })
    .min(0, 'Massa Gorda não pode ser negativa')
    .max(300, 'Massa Gorda deve ser de no máximo 300 kg')
    .nullable()
    .optional(),
  massaMuscularKg: positiveOptional('Massa Muscular Esquelética', 250),
  aguaCorporalPct: z
    .number({ invalid_type_error: 'Água Corporal deve ser um número válido' })
    .min(10, 'Água Corporal deve ser de no mínimo 10%')
    .max(90, 'Água Corporal deve ser de no máximo 90%')
    .nullable()
    .optional(),
  gorduraVisceral: z
    .number({ invalid_type_error: 'Gordura Visceral deve ser um número válido' })
    .min(1, 'Gordura Visceral deve ser entre 1 e 60')
    .max(60, 'Gordura Visceral deve ser de no máximo 60')
    .nullable()
    .optional(),
  taxaMetabolicaBia: positiveOptional('TMB da Bioimpedância', 10000),
  idadeMetabolica: z
    .number({ invalid_type_error: 'Idade Metabólica deve ser um número válido' })
    .int('Idade Metabólica deve ser um número inteiro')
    .min(5, 'Idade Metabólica deve ser de no mínimo 5 anos')
    .max(120, 'Idade Metabólica deve ser de no máximo 120 anos')
    .nullable()
    .optional(),
  observacoes: z.string().trim().max(1000, 'Observações devem ter no máximo 1000 caracteres').nullable().optional(),
});

export type CreateMedidaInput = z.infer<typeof createMedidaSchema>;

export const updateMedidaSchema = createMedidaSchema
  .omit({ pacienteId: true })
  .partial();

export type UpdateMedidaInput = z.infer<typeof updateMedidaSchema>;
