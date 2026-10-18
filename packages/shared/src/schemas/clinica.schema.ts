import { z } from 'zod';

export const onboardingSchema = z.object({
  tipo: z.enum(['AUTONOMO', 'CLINICA']).optional().default('CLINICA'),
  clinica: z.object({
    nome: z.string().min(2, 'Nome da clínica deve ter no mínimo 2 caracteres'),
    cnpj: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email('E-mail inválido').optional(),
    endereco: z.string().optional(),
  }),
  admin: z.object({
    nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const updateClinicaSchema = z.object({
  nome: z.string().min(2).optional(),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  endereco: z.string().optional(),
  logomarca: z.string().nullable().optional(),
});

export type UpdateClinicaInput = z.infer<typeof updateClinicaSchema>;

export const alterarTipoSchema = z.object({
  tipo: z.enum(['AUTONOMO', 'CLINICA']),
});

export type AlterarTipoInput = z.infer<typeof alterarTipoSchema>;
