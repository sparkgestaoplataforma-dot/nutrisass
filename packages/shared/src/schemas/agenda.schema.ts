import { z } from "zod";

export const createAgendamentoSchema = z.object({
  pacienteId: z
    .string()
    .max(36, "Paciente inválido")
    .uuid("Paciente é obrigatório"),
  convenioId: z.string().max(36, "Convênio inválido").uuid().optional(),
  dataHora: z
    .string()
    .trim()
    .min(1, "Data e hora são obrigatórios")
    .max(40, "Data e hora inválidas"),
  tipo: z.enum(["CONSULTA", "RETORNO"]),
  status: z
    .enum([
      "AGENDADO",
      "CONFIRMOU",
      "PRESENTE",
      "ENCAIXE",
      "CANCELADO",
      "NAO_COMPARECEU",
      "REALIZADO",
      "DESISTIU",
      "REMARCOU",
    ])
    .default("AGENDADO"),
  encaixe: z.boolean().default(false),
  observacao: z
    .string()
    .trim()
    .max(2000, "Observação deve ter no máximo 2000 caracteres")
    .optional(),
});

export type CreateAgendamentoInput = z.infer<typeof createAgendamentoSchema>;

export const updateAgendamentoSchema = createAgendamentoSchema.partial();

export type UpdateAgendamentoInput = z.infer<typeof updateAgendamentoSchema>;

export const updateStatusSchema = z.object({
  status: z.enum([
    "AGENDADO",
    "CONFIRMOU",
    "PRESENTE",
    "ENCAIXE",
    "CANCELADO",
    "NAO_COMPARECEU",
    "REALIZADO",
    "DESISTIU",
    "REMARCOU",
  ]),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
