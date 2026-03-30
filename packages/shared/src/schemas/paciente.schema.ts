import { z } from "zod";

export const createPacienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres"),
  email: z
    .string()
    .trim()
    .max(254, "E-mail deve ter no máximo 254 caracteres")
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  telefone: z
    .string()
    .trim()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .optional(),
  whatsapp: z
    .string()
    .trim()
    .max(20, "WhatsApp deve ter no máximo 20 caracteres")
    .optional(),
  sexo: z.enum(["MASCULINO", "FEMININO"]).optional(),
  dataNascimento: z
    .string()
    .trim()
    .max(40, "Data de nascimento inválida")
    .optional(),
  identidade: z
    .string()
    .trim()
    .max(30, "Identidade deve ter no máximo 30 caracteres")
    .optional(),
  ufIdentidade: z.string().trim().max(2).optional(),
  orgaoExpedidor: z
    .string()
    .trim()
    .max(30, "Órgão expedidor deve ter no máximo 30 caracteres")
    .optional(),
  cpf: z
    .string()
    .trim()
    .max(14, "CPF deve ter no máximo 14 caracteres")
    .optional(),
  endereco: z
    .string()
    .trim()
    .max(255, "Endereço deve ter no máximo 255 caracteres")
    .optional(),
  bairro: z
    .string()
    .trim()
    .max(120, "Bairro deve ter no máximo 120 caracteres")
    .optional(),
  municipio: z
    .string()
    .trim()
    .max(120, "Município deve ter no máximo 120 caracteres")
    .optional(),
  uf: z.string().trim().max(2).optional(),
  cep: z
    .string()
    .trim()
    .max(10, "CEP deve ter no máximo 10 caracteres")
    .optional(),
  profissao: z
    .string()
    .trim()
    .max(120, "Profissão deve ter no máximo 120 caracteres")
    .optional(),
  escolaridade: z
    .string()
    .trim()
    .max(120, "Escolaridade deve ter no máximo 120 caracteres")
    .optional(),
  nomeMae: z
    .string()
    .trim()
    .max(120, "Nome da mãe deve ter no máximo 120 caracteres")
    .optional(),
  convenioId: z.string().max(36, "Convênio inválido").uuid().optional(),
  numeroCarteira: z
    .string()
    .trim()
    .max(50, "Número da carteira deve ter no máximo 50 caracteres")
    .optional(),
  validadeCarteira: z
    .string()
    .trim()
    .max(40, "Validade da carteira inválida")
    .optional(),
});

export type CreatePacienteInput = z.infer<typeof createPacienteSchema>;

export const updatePacienteSchema = createPacienteSchema.partial();

export type UpdatePacienteInput = z.infer<typeof updatePacienteSchema>;

export const createPacienteQuestionarioAvaliacaoSchema = z.object({
  // id: z.string().uuid(),
  // questionarioId: z.string().uuid(),
  respostas: z.array(
    z.object({
      perguntaId: z.string().max(36, "Pergunta inválida").uuid(),
      nota: z
        .number()
        .min(0, "A nota deve ser entre 0 e 4")
        .max(4, "A nota deve ser entre 0 e 4"),
    }),
  ),
});

export const UpdatePacienteQuestionarioAvaliacaoSchema =
  createPacienteQuestionarioAvaliacaoSchema.partial();

export type CreatePacienteQuestionarioAvaliacaoInput = z.infer<
  typeof createPacienteQuestionarioAvaliacaoSchema
>;
