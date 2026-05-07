import { z } from "zod";

export const planoAlimentoSchema = z.object({
  alimento: z.string().min(1, "O nome do alimento é obrigatório"),
  quantidade: z.number().min(0, "A quantidade deve ser maior ou igual a 0"),
  unidade: z.string().min(1, "A unidade é obrigatória"),
  calorias: z.number().optional().nullable(),
  proteinas: z.number().optional().nullable(),
  carboidratos: z.number().optional().nullable(),
  gorduras: z.number().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export const planoRefeicaoSchema = z.object({
  nome: z.string().min(1, "O nome da refeição é obrigatório"),
  horario: z.string().min(1, "O horário é obrigatório"),
  ordem: z.number().min(0),
  alimentos: z.array(planoAlimentoSchema),
});

export const createPlanoAlimentarSchema = z.object({
  pacienteId: z.string().uuid("ID do paciente inválido"),
  titulo: z.string().min(1, "O título é obrigatório"),
  observacoes: z.string().optional().nullable(),
  refeicoes: z.array(planoRefeicaoSchema),
});

export type CreatePlanoAlimentarInput = z.infer<typeof createPlanoAlimentarSchema>;

export const updatePlanoAlimentarSchema = createPlanoAlimentarSchema.partial().extend({
  refeicoes: z.array(planoRefeicaoSchema).optional(),
});

export type UpdatePlanoAlimentarInput = z.infer<typeof updatePlanoAlimentarSchema>;
