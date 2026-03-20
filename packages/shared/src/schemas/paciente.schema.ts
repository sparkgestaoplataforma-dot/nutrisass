import { z } from "zod";

export const createPacienteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  sexo: z.enum(["MASCULINO", "FEMININO"]).optional(),
  dataNascimento: z.string().optional(),
  identidade: z.string().optional(),
  ufIdentidade: z.string().max(2).optional(),
  orgaoExpedidor: z.string().optional(),
  cpf: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().max(2).optional(),
  cep: z.string().optional(),
  profissao: z.string().optional(),
  escolaridade: z.string().optional(),
  nomeMae: z.string().optional(),
  convenioId: z.string().uuid().optional(),
  numeroCarteira: z.string().optional(),
  validadeCarteira: z.string().optional(),
});

export type CreatePacienteInput = z.infer<typeof createPacienteSchema>;

export const updatePacienteSchema = createPacienteSchema.partial();

export type UpdatePacienteInput = z.infer<typeof updatePacienteSchema>;

export const createPacienteQuestionarioAvaliacaoSchema = z.object({
  // id: z.string().uuid(),
  // questionarioId: z.string().uuid(),
  respostas: z.array(
    z.object({
      perguntaId: z.string().uuid(),
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
