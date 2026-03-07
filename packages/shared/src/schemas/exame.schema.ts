import { z } from 'zod';

export const solicitarExameSchema = z.object({
  pacienteId: z.string().uuid(),
  exameBaseIds: z.array(z.string().uuid()).min(1, 'Selecione ao menos um exame'),
});

export type SolicitarExameInput = z.infer<typeof solicitarExameSchema>;

export const registrarResultadoSchema = z.object({
  itemId: z.string().uuid(),
  dataResultado: z.string().min(1, 'Data do resultado é obrigatória'),
  resultado: z.string().min(1, 'Resultado é obrigatório'),
});

export type RegistrarResultadoInput = z.infer<typeof registrarResultadoSchema>;

export const createExameBaseSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  valorMinimo: z.number().optional(),
  valorMaximo: z.number().optional(),
  unidade: z.string().optional(),
});

export type CreateExameBaseInput = z.infer<typeof createExameBaseSchema>;
