import { z } from "zod";

export const createConvenioSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres"),
  registroANS: z
    .string()
    .trim()
    .max(30, "Registro ANS deve ter no máximo 30 caracteres")
    .optional(),
});

export type CreateConvenioInput = z.infer<typeof createConvenioSchema>;

export const updateConvenioSchema = createConvenioSchema.partial();

export type UpdateConvenioInput = z.infer<typeof updateConvenioSchema>;
