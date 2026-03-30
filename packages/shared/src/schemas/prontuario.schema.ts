import { z } from "zod";

export const createEvolucaoSchema = z.object({
  pacienteId: z.string().max(36, "Paciente inválido").uuid(),
  estadoClinico: z
    .string()
    .trim()
    .max(4000, "Estado clínico deve ter no máximo 4000 caracteres")
    .optional(),
  aparelhoDigestivo: z
    .string()
    .trim()
    .max(4000, "Aparelho digestivo deve ter no máximo 4000 caracteres")
    .optional(),
  antecedentesMorbidos: z
    .string()
    .trim()
    .max(4000, "Antecedentes mórbidos deve ter no máximo 4000 caracteres")
    .optional(),
  medicamentos: z
    .string()
    .trim()
    .max(4000, "Medicamentos deve ter no máximo 4000 caracteres")
    .optional(),
  outros: z
    .string()
    .trim()
    .max(4000, "Outros deve ter no máximo 4000 caracteres")
    .optional(),
});

export type CreateEvolucaoInput = z.infer<typeof createEvolucaoSchema>;

export const createMedidaSchema = z.object({
  pacienteId: z.string().max(36, "Paciente inválido").uuid(),
  data: z.string().trim().min(1, "Data é obrigatória").max(40, "Data inválida"),
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
