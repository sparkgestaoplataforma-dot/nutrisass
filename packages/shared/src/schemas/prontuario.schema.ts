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

export const createMedidaSchema = z.object({
  pacienteId: z.string().uuid(),
  data: z.string().min(1, 'Data é obrigatória'),
  peso: z.number().positive().optional(),
  altura: z.number().positive().optional(),
  cintura: z.number().positive().optional(),
  abdomen: z.number().positive().optional(),
  quadril: z.number().positive().optional(),
  bracoDireito: z.number().positive().optional(),
  bracoEsquerdo: z.number().positive().optional(),
  coxaDireita: z.number().positive().optional(),
  coxaEsquerda: z.number().positive().optional(),
  culote: z.number().positive().optional(),
});

export type CreateMedidaInput = z.infer<typeof createMedidaSchema>;
