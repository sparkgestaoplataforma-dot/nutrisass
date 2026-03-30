import { z } from "zod";

export const solicitarExameSchema = z.object({
  pacienteId: z.string().max(36, "Paciente inválido").uuid(),
  exameBaseIds: z
    .array(z.string().max(36, "Exame inválido").uuid())
    .min(1, "Selecione ao menos um exame"),
});

export type SolicitarExameInput = z.infer<typeof solicitarExameSchema>;

export const registrarResultadoSchema = z.object({
  itemId: z.string().max(36, "Item inválido").uuid(),
  dataResultado: z
    .string()
    .trim()
    .min(1, "Data do resultado é obrigatória")
    .max(40, "Data do resultado inválida"),
  resultado: z
    .string()
    .trim()
    .min(1, "Resultado é obrigatório")
    .max(4000, "Resultado deve ter no máximo 4000 caracteres"),
});

export type RegistrarResultadoInput = z.infer<typeof registrarResultadoSchema>;

export const createExameBaseSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, "Código é obrigatório")
    .max(30, "Código deve ter no máximo 30 caracteres"),
  nome: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(150, "Nome deve ter no máximo 150 caracteres"),
  valorMinimo: z.number().optional(),
  valorMaximo: z.number().optional(),
  unidade: z
    .string()
    .trim()
    .max(20, "Unidade deve ter no máximo 20 caracteres")
    .optional(),
});

export type CreateExameBaseInput = z.infer<typeof createExameBaseSchema>;
