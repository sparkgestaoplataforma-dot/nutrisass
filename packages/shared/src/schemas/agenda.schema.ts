import { z } from 'zod';

export const createAgendamentoSchema = z.object({
  pacienteId: z.string().uuid('Paciente é obrigatório'),
  convenioId: z.preprocess((val) => (val === "" ? undefined : val), z.string().uuid().optional()),
  dataHora: z.string().min(1, 'Data e hora são obrigatórios'),
  tipo: z.enum(['CONSULTA', 'RETORNO']),
  status: z.enum([
    'AGENDADO', 'CONFIRMOU', 'PRESENTE', 'ENCAIXE',
    'CANCELADO', 'NAO_COMPARECEU', 'REALIZADO', 'DESISTIU', 'REMARCOU',
  ]).default('AGENDADO'),
  encaixe: z.boolean().default(false),
  observacao: z.string().optional(),
});

export type CreateAgendamentoInput = z.infer<typeof createAgendamentoSchema>;

export const updateAgendamentoSchema = createAgendamentoSchema.partial();

export type UpdateAgendamentoInput = z.infer<typeof updateAgendamentoSchema>;

export const updateStatusSchema = z.object({
  status: z.enum([
    'AGENDADO', 'CONFIRMOU', 'PRESENTE', 'ENCAIXE',
    'CANCELADO', 'NAO_COMPARECEU', 'REALIZADO', 'DESISTIU', 'REMARCOU',
  ]),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
