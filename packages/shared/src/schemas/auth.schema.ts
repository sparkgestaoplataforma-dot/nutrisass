import { z } from "zod";

export const loginSchema = z.object({
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
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUsuarioSchema = z.object({
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
  perfil: z.enum(["ADMIN", "NUTRICIONISTA", "SECRETARIA"]),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;

export const verifyEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, "E-mail deve ter no máximo 254 caracteres")
    .email("E-mail inválido"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const changePasswordSchema = z.object({
  novaSenha: z
    .string()
    .trim()
    .min(6, "Nova senha deve ter no mínimo 6 caracteres")
    .max(128, "Nova senha deve ter no máximo 128 caracteres"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
