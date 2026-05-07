import { z } from "zod";

export const medidaCaseiraSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, "O nome da medida é obrigatório"),
  quantidadeEmGramas: z.number().min(0, "A quantidade deve ser maior ou igual a 0"),
});

export const alimentoSchema = z.object({
  nome: z.string().min(1, "O nome do alimento é obrigatório"),
  codigo: z.string().optional().nullable(),
  grupo: z.string().optional().nullable(),
  calorias: z.number().optional().nullable(),
  proteinas: z.number().optional().nullable(),
  carboidratos: z.number().optional().nullable(),
  gorduras: z.number().optional().nullable(),
  fibra: z.number().optional().nullable(),
  medidasCaseiras: z.array(medidaCaseiraSchema).optional(),
});

export type AlimentoInput = z.infer<typeof alimentoSchema>;
