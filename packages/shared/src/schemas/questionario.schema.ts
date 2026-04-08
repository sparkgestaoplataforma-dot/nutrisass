import { z } from "zod";

export const createQuestionarioSchema = z.object({
  nome: z.string().min(3, "Nome deve conter pelo menos 3 caracteres"),
  versao: z
    .number({ message: "A Versão deve ser um número" })
    .int({ message: "A Versão deve ser um número inteiro" })
    .positive({ message: "a Versão deve ser um número inteiro positivo" })
    .optional(),
  ativo: z.boolean().optional(),
});

export const updateQuestionarioSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve conter pelo menos 3 caracteres")
    .optional(),
});

export type CreateQuestionarioInput = z.infer<typeof createQuestionarioSchema>;
export type UpdateQuestionarioInput = z.infer<typeof updateQuestionarioSchema>;

export const createQuestionarioModuloSchema = z.object({
  //   questionarioId: z.string().uuid(),
  nome: z.string().min(3, "Nome deve conter pelo menos 3 caracteres"),
  ordem: z
    .number({ message: "A Ordem deve ser um número" })
    .int({ message: "A Ordem deve ser um número inteiro" })
    .positive({ message: "A Ordem deve ser um número inteiro positivo" }),
});

export type CreateQuestionarioModuloInput = z.infer<
  typeof createQuestionarioModuloSchema
>;

export const updateQuestionarioModuloSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve conter pelo menos 3 caracteres")
    .optional(),
  ordem: z
    .number({ message: "A Ordem deve ser um número" })
    .int({ message: "A Ordem deve ser um número inteiro" })
    .positive({ message: "A Ordem deve ser um número inteiro positivo" })
    .optional(),
});

export type UpdateQuestionarioModuloInput = z.infer<
  typeof updateQuestionarioModuloSchema
>;

export const createModuloPerguntaSchema = z.object({
  //   moduloId: z.string().uuid(),
  descricao: z.string().min(3, "Descrição deve conter pelo menos 3 caracteres"),
  ordem: z
    .number({ message: "A Ordem deve ser um número" })
    .int({ message: "A Ordem deve ser um número inteiro" })
    .positive({ message: "A Ordem deve ser um número inteiro positivo" }),
});

export type CreateModuloPerguntaInput = z.infer<
  typeof createModuloPerguntaSchema
>;

export const updateModuloPerguntaSchema = z.object({
  descricao: z
    .string()
    .min(3, "Descrição deve conter pelo menos 3 caracteres")
    .optional(),
  ordem: z
    .number({ message: "A Ordem deve ser um número" })
    .int({ message: "A Ordem deve ser um número inteiro" })
    .positive({ message: "A Ordem deve ser um número inteiro positivo" })
    .optional(),
});

export type UpdateModuloPerguntaInput = z.infer<
  typeof updateModuloPerguntaSchema
>;

export const createQuestionarioRegrasInterpretacaoSchema = z.object({
  //   questionarioId: z.string().uuid(),
  pontuacaoMin: z
    .number({ message: "A Pontuação Mínima deve ser um número" })
    .nonnegative({ message: "A Pontuação Mínima deve ser um número positivo" }),
  pontuacaoMax: z
    .number({ message: "A Pontuação Máxima deve ser um número" })
    .nonnegative({ message: "A Pontuação Máxima deve ser um número positivo" }),
  classificacao: z
    .string()
    .min(3, "Classificação deve conter pelo menos 3 caracteres"),
});

export type CreateQuestionarioRegrasInterpretacaoInput = z.infer<
  typeof createQuestionarioRegrasInterpretacaoSchema
>;

export const labelEscolhaItemSchema = z.object({
  nota: z
    .number({ message: "A Nota deve ser um número" })
    .int({ message: "A Nota deve ser um número inteiro" })
    .min(0, "A Nota deve estar entre 0 e 4")
    .max(4, "A Nota deve estar entre 0 e 4"),
  label: z.string().min(1, "O Label é obrigatório"),
});

export const upsertLabelEscolhaSchema = z
  .array(labelEscolhaItemSchema)
  .min(1, "Informe ao menos um item");

export const updateLabelEscolhaSchema = z.object({
  label: z.string().min(1, "O Label é obrigatório"),
});

export type LabelEscolhaItemInput = z.infer<typeof labelEscolhaItemSchema>;
export type UpsertLabelEscolhaInput = z.infer<typeof upsertLabelEscolhaSchema>;
export type UpdateLabelEscolhaInput = z.infer<typeof updateLabelEscolhaSchema>;
