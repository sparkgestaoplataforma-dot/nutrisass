import { z } from "zod";

export enum ObjetivoPlano {
  EMAGRECIMENTO = "EMAGRECIMENTO",
  HIPERTROFIA = "HIPERTROFIA",
  MANUTENCAO = "MANUTENCAO",
  REEDUCACAO_ALIMENTAR = "REEDUCACAO_ALIMENTAR",
  OUTRO = "OUTRO",
}

export const planoAlimentoSchema = z.object({
  alimentoId: z.string().uuid().optional().nullable(),
  medidaCaseiraId: z.string().uuid().optional().nullable(),
  alimento: z.string().trim().min(1, "O nome do alimento é obrigatório"),
  quantidade: z.number().min(0, "A quantidade deve ser maior ou igual a 0"),
  unidade: z.string().trim().min(1, "A unidade é obrigatória"),
  calorias: z.number().optional().nullable(),
  proteinas: z.number().optional().nullable(),
  carboidratos: z.number().optional().nullable(),
  gorduras: z.number().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export const planoOpcaoRefeicaoSchema = z.object({
  nome: z.string().optional().nullable(),
  ordem: z.number().min(0),
  alimentos: z.array(planoAlimentoSchema),
});

export const planoRefeicaoSchema = z.object({
  nome: z.string().trim().min(1, "O nome da refeição é obrigatório"),
  horario: z.string().trim().min(1, "O horário é obrigatório"),
  ordem: z.number().min(0),
  opcoes: z.array(planoOpcaoRefeicaoSchema).max(10, "Máximo de 10 opções por refeição"),
});

export const createPlanoAlimentarSchema = z.object({
  pacienteId: z.string().uuid("ID do paciente inválido").optional().nullable(),
  isTemplate: z.boolean().optional(),
  titulo: z.string().trim().min(1, "O título é obrigatório"),
  objetivo: z.nativeEnum(ObjetivoPlano).optional().nullable(),
  metaCalorias: z.number().optional().nullable(),
  metaProteinas: z.number().optional().nullable(),
  metaCarboidratos: z.number().optional().nullable(),
  metaGorduras: z.number().optional().nullable(),
  recomendacaoAguaMl: z.number().int().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  refeicoes: z.array(planoRefeicaoSchema),
});

export type CreatePlanoAlimentarInput = z.infer<typeof createPlanoAlimentarSchema>;

export const updatePlanoAlimentarSchema = createPlanoAlimentarSchema.partial().extend({
  refeicoes: z.array(planoRefeicaoSchema).optional(),
});

export type UpdatePlanoAlimentarInput = z.infer<typeof updatePlanoAlimentarSchema>;
