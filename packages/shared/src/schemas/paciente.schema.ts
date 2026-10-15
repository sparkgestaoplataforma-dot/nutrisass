import { z } from "zod";

/**
 * Validação oficial de CPF com cálculo dos dígitos verificadores (módulo 11)
 * e rejeição de sequências de 11 dígitos iguais.
 */
export function validarCpf(cpf: string): boolean {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;

  // Rejeita sequências de dígitos repetidos conhecidas (00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  if (digito1 !== parseInt(clean.charAt(9), 10)) return false;

  // 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  if (digito2 !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Normaliza número de telefone ou WhatsApp brasileiro para apenas dígitos,
 * removendo prefixo internacional 55 quando presente.
 */
export function normalizarTelefone(valor: string): string {
  let clean = (valor || "").replace(/\D/g, "");
  if ((clean.length === 12 || clean.length === 13) && clean.startsWith("55")) {
    clean = clean.slice(2);
  }
  return clean;
}

const normalizeOptionalString = (schema: z.ZodString) =>
  z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === "" || val === null) return null;
    return typeof val === "string" ? val.trim() : val;
  }, schema.nullable().optional());

const dateStringSchema = z.preprocess(
  (val) => {
    if (val === undefined) return undefined;
    if (val === "" || val === null) return null;
    return typeof val === "string" ? val.trim() : val;
  },
  z
    .string()
    .refine((val) => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime());
    }, "Data inválida")
    .nullable()
    .optional(),
);

/**
 * Valida se a data de nascimento não é posterior à data atual (considerando dia, mês e ano).
 * Permite nascimentos na data de hoje.
 */
export function validarDataNascimento(val: string): boolean {
  if (!val) return true;
  const d = new Date(val);
  if (isNaN(d.getTime())) return false;

  let ano: number;
  let mes: number;
  let dia: number;

  const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    ano = parseInt(match[1], 10);
    mes = parseInt(match[2], 10) - 1;
    dia = parseInt(match[3], 10);
  } else {
    ano = d.getFullYear();
    mes = d.getMonth();
    dia = d.getDate();
  }

  const agora = new Date();
  const fimDeHojeLocal = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    23,
    59,
    59,
    999,
  );
  const fimDeHojeUTC = new Date(
    Date.UTC(
      agora.getUTCFullYear(),
      agora.getUTCMonth(),
      agora.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );

  const dataInformada = new Date(ano, mes, dia, 0, 0, 0, 0);
  const tetoPermitido = Math.max(fimDeHojeLocal.getTime(), fimDeHojeUTC.getTime());

  if (dataInformada.getTime() > tetoPermitido) {
    return false;
  }

  if (ano < 1900) {
    return false;
  }

  return true;
}

export const dataNascimentoSchema = z.preprocess(
  (val) => {
    if (val === undefined) return undefined;
    if (val === "" || val === null) return null;
    return typeof val === "string" ? val.trim() : val;
  },
  z
    .string()
    .refine((val) => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime());
    }, "Data de nascimento inválida")
    .refine(
      (val) => {
        if (!val) return true;
        return validarDataNascimento(val);
      },
      "Data de nascimento não pode ser posterior à data atual",
    )
    .nullable()
    .optional(),
);

export const createPacienteSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(150, "Nome não pode exceder 150 caracteres")
    .transform((val) => val.replace(/\s+/g, " ")),

  cpf: z
    .string({ required_error: "CPF é obrigatório" })
    .trim()
    .min(1, "CPF é obrigatório")
    .refine(validarCpf, "CPF inválido")
    .transform((val) => val.replace(/\D/g, "")),

  whatsapp: z
    .string({ required_error: "WhatsApp é obrigatório" })
    .trim()
    .min(1, "WhatsApp é obrigatório")
    .transform(normalizarTelefone)
    .refine(
      (clean) => clean.length >= 10 && clean.length <= 11,
      "WhatsApp inválido (informe DDD + número com 10 ou 11 dígitos)",
    ),

  email: normalizeOptionalString(z.string().email("E-mail inválido").toLowerCase()),

  telefone: z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (val === "" || val === null) return null;
      return typeof val === "string" ? normalizarTelefone(val) : val;
    },
    z
      .string()
      .refine(
        (clean) => clean.length === 0 || (clean.length >= 10 && clean.length <= 11),
        "Telefone inválido (informe DDD + número com 10 ou 11 dígitos)",
      )
      .nullable()
      .optional(),
  ),

  sexo: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === "" || val === null) return null;
    return val;
  }, z.enum(["MASCULINO", "FEMININO"]).nullable().optional()),

  dataNascimento: dataNascimentoSchema,
  identidade: normalizeOptionalString(z.string().max(30)),
  ufIdentidade: normalizeOptionalString(z.string().max(2)),
  orgaoExpedidor: normalizeOptionalString(z.string().max(20)),
  endereco: normalizeOptionalString(z.string().max(150)),
  bairro: normalizeOptionalString(z.string().max(100)),
  municipio: normalizeOptionalString(z.string().max(100)),
  uf: normalizeOptionalString(z.string().max(2)),

  cep: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === "" || val === null) return null;
    return typeof val === "string" ? val.replace(/\D/g, "") : val;
  }, z.string().max(8).nullable().optional()),

  profissao: normalizeOptionalString(z.string().max(100)),
  escolaridade: normalizeOptionalString(z.string().max(100)),
  nomeMae: normalizeOptionalString(z.string().max(100)),

  convenioId: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === "" || val === null) return null;
    return val;
  }, z.string().uuid("Convênio inválido").nullable().optional()),

  numeroCarteira: normalizeOptionalString(z.string().max(50)),
  validadeCarteira: dateStringSchema,
});

export type CreatePacienteInput = z.infer<typeof createPacienteSchema>;

export const updatePacienteSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(2, "Nome deve ter no mínimo 2 caracteres")
      .max(150, "Nome não pode exceder 150 caracteres")
      .transform((val) => val.replace(/\s+/g, " "))
      .optional(),

    cpf: z
      .string()
      .trim()
      .min(1, "CPF não pode ser vazio")
      .refine(validarCpf, "CPF inválido")
      .transform((val) => val.replace(/\D/g, ""))
      .optional(),

    whatsapp: z
      .string()
      .trim()
      .transform(normalizarTelefone)
      .refine(
        (clean) => clean.length >= 10 && clean.length <= 11,
        "WhatsApp inválido (informe DDD + número com 10 ou 11 dígitos)",
      )
      .optional(),

    email: normalizeOptionalString(z.string().email("E-mail inválido").toLowerCase()),

    telefone: z.preprocess(
      (val) => {
        if (val === undefined) return undefined;
        if (val === "" || val === null) return null;
        return typeof val === "string" ? normalizarTelefone(val) : val;
      },
      z
        .string()
        .refine(
          (clean) => clean.length === 0 || (clean.length >= 10 && clean.length <= 11),
          "Telefone inválido (informe DDD + número com 10 ou 11 dígitos)",
        )
        .nullable()
        .optional(),
    ),

    sexo: z.preprocess((val) => {
      if (val === undefined) return undefined;
      if (val === "" || val === null) return null;
      return val;
    }, z.enum(["MASCULINO", "FEMININO"]).nullable().optional()),

    dataNascimento: dataNascimentoSchema,
    identidade: normalizeOptionalString(z.string().max(30)),
    ufIdentidade: normalizeOptionalString(z.string().max(2)),
    orgaoExpedidor: normalizeOptionalString(z.string().max(20)),
    endereco: normalizeOptionalString(z.string().max(150)),
    bairro: normalizeOptionalString(z.string().max(100)),
    municipio: normalizeOptionalString(z.string().max(100)),
    uf: normalizeOptionalString(z.string().max(2)),

    cep: z.preprocess((val) => {
      if (val === undefined) return undefined;
      if (val === "" || val === null) return null;
      return typeof val === "string" ? val.replace(/\D/g, "") : val;
    }, z.string().max(8).nullable().optional()),

    profissao: normalizeOptionalString(z.string().max(100)),
    escolaridade: normalizeOptionalString(z.string().max(100)),
    nomeMae: normalizeOptionalString(z.string().max(100)),

    convenioId: z.preprocess((val) => {
      if (val === undefined) return undefined;
      if (val === "" || val === null) return null;
      return val;
    }, z.string().uuid("Convênio inválido").nullable().optional()),

    numeroCarteira: normalizeOptionalString(z.string().max(50)),
    validadeCarteira: dateStringSchema,
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Pelo menos um campo deve ser fornecido para atualização",
  );

export type UpdatePacienteInput = z.infer<typeof updatePacienteSchema>;

export const pacienteIdParamSchema = z.object({
  id: z.string().uuid("ID de paciente inválido"),
});

export const listarPacientesQuerySchema = z.object({
  busca: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createPacienteQuestionarioAvaliacaoSchema = z.object({
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
