import { z } from 'zod';

export const createConvenioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  registroANS: z.string().optional(),
});

export type CreateConvenioInput = z.infer<typeof createConvenioSchema>;

export const updateConvenioSchema = createConvenioSchema.partial();

export type UpdateConvenioInput = z.infer<typeof updateConvenioSchema>;
