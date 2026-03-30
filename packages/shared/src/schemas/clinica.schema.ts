import { z } from "zod";

export const onboardingSchema = z.object({
  clinica: z.object({
    nome: z
      .string()
      .trim()
      .min(2, "Nome da clínica deve ter no mínimo 2 caracteres")
      .max(120, "Nome da clínica deve ter no máximo 120 caracteres"),
    cnpj: z
      .string()
      .trim()
      .max(18, "CNPJ deve ter no máximo 18 caracteres")
      .optional(),
    telefone: z
      .string()
      .trim()
      .max(20, "Telefone deve ter no máximo 20 caracteres")
      .optional(),
    email: z
      .string()
      .trim()
      .max(254, "E-mail deve ter no máximo 254 caracteres")
      .email("E-mail inválido")
      .optional(),
    endereco: z
      .string()
      .trim()
      .max(255, "Endereço deve ter no máximo 255 caracteres")
      .optional(),
  }),
  admin: z.object({
    nome: z
      .string()
      .trim()
      .min(2, "Nome deve ter no mínimo 2 caracteres")
      .max(120, "Nome deve ter no máximo 120 caracteres"),
    email: z
      .string()
      .trim()
      .max(254, "E-mail deve ter no máximo 254 caracteres")
      .email("E-mail inválido"),
    senha: z
      .string()
      .trim()
      .min(6, "Senha deve ter no mínimo 6 caracteres")
      .max(128, "Senha deve ter no máximo 128 caracteres"),
  }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const updateClinicaSchema = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  cnpj: z.string().trim().max(18).optional(),
  telefone: z.string().trim().max(20).optional(),
  email: z.string().trim().max(254).email().optional(),
  endereco: z.string().trim().max(255).optional(),
  logomarca: z.string().trim().max(2048).optional(),
});

export type UpdateClinicaInput = z.infer<typeof updateClinicaSchema>;
