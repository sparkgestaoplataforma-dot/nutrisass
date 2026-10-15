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

// Lançamento direto de exames externos (trazidos pelo paciente, sem solicitação prévia)
export const lancarExameExternoSchema = z.object({
  dataResultado: z.string().min(1, 'Data do resultado é obrigatória'),
  itens: z
    .array(
      z.object({
        exameBaseId: z.string().uuid(),
        resultado: z.string().min(1, 'Resultado é obrigatório'),
      }),
    )
    .min(1, 'Informe ao menos um exame'),
});

export type LancarExameExternoInput = z.infer<typeof lancarExameExternoSchema>;

export const createExameBaseSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  valorMinimo: z.number().optional(),
  valorMaximo: z.number().optional(),
  unidade: z.string().optional(),
});

export type CreateExameBaseInput = z.infer<typeof createExameBaseSchema>;
