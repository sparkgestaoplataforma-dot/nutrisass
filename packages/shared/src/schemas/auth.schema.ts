import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUsuarioSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  perfil: z.enum(["ADMIN", "NUTRICIONISTA", "SECRETARIA"]),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const changePasswordSchema = z.object({
  novaSenha: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
