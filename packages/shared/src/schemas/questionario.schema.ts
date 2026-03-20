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
  versao: z
    .number({ message: "A Versão deve ser um número" })
    .int({ message: "A Versão deve ser um número inteiro" })
    .positive({ message: "a Versão deve ser um número inteiro positivo" })
    .optional(),
  ativo: z.boolean().optional(),
});

export type CreateQuestionarioInput = z.infer<typeof createQuestionarioSchema>;
export type UpdateQuestionarioInput = z.infer<typeof updateQuestionarioSchema>;

export const createQuestionarioModuloSchema = z.object({
  questionarioId: z.string().uuid(),
  nome: z.string().min(3, "Nome deve conter pelo menos 3 caracteres"),
  ordem: z
    .number({ message: "A Ordem deve ser um número" })
    .int({ message: "A Ordem deve ser um número inteiro" })
    .positive({ message: "A Ordem deve ser um número inteiro positivo" }),
});

export type CreateQuestionarioModuloInput = z.infer<
  typeof createQuestionarioModuloSchema
>;

export const createModuloPerguntaSchema = z.object({
  moduloId: z.string().uuid(),
  descricao: z.string().min(3, "Descrição deve conter pelo menos 3 caracteres"),
  ordem: z
    .number({ message: "A Ordem deve ser um número" })
    .int({ message: "A Ordem deve ser um número inteiro" })
    .positive({ message: "A Ordem deve ser um número inteiro positivo" }),
});

export type CreateModuloPerguntaInput = z.infer<
  typeof createModuloPerguntaSchema
>;

export const createQuestionarioRegrasInterpretacaoSchema = z.object({
  questionarioId: z.string().uuid(),
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
