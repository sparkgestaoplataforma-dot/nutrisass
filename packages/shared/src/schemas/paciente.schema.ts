import { z } from "zod";

const emptyToUndefined = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => (val === "" || val === null ? undefined : val), schema);

export const createPacienteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: emptyToUndefined(z.string().email("E-mail inválido").optional().nullable()),
  telefone: emptyToUndefined(z.string().optional().nullable()),
  whatsapp: emptyToUndefined(z.string().optional().nullable()),
  sexo: emptyToUndefined(z.enum(["MASCULINO", "FEMININO"]).optional().nullable()),
  dataNascimento: emptyToUndefined(z.string().optional().nullable()),
  identidade: emptyToUndefined(z.string().optional().nullable()),
  ufIdentidade: emptyToUndefined(z.string().max(2).optional().nullable()),
  orgaoExpedidor: emptyToUndefined(z.string().optional().nullable()),
  cpf: emptyToUndefined(z.string().optional().nullable()),
  endereco: emptyToUndefined(z.string().optional().nullable()),
  bairro: emptyToUndefined(z.string().optional().nullable()),
  municipio: emptyToUndefined(z.string().optional().nullable()),
  uf: emptyToUndefined(z.string().max(2).optional().nullable()),
  cep: emptyToUndefined(z.string().optional().nullable()),
  profissao: emptyToUndefined(z.string().optional().nullable()),
  escolaridade: emptyToUndefined(z.string().optional().nullable()),
  nomeMae: emptyToUndefined(z.string().optional().nullable()),
  convenioId: emptyToUndefined(z.string().uuid("Convênio inválido").optional().nullable()),
  numeroCarteira: emptyToUndefined(z.string().optional().nullable()),
  validadeCarteira: emptyToUndefined(z.string().optional().nullable()),
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
