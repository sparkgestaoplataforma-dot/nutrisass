export const Perfil = {
  ADMIN: 'ADMIN',
  NUTRICIONISTA: 'NUTRICIONISTA',
  SECRETARIA: 'SECRETARIA',
} as const;

export type Perfil = (typeof Perfil)[keyof typeof Perfil];

export const Sexo = {
  MASCULINO: 'MASCULINO',
  FEMININO: 'FEMININO',
} as const;

export type Sexo = (typeof Sexo)[keyof typeof Sexo];

export const TipoAgendamento = {
  CONSULTA: 'CONSULTA',
  RETORNO: 'RETORNO',
} as const;

export type TipoAgendamento = (typeof TipoAgendamento)[keyof typeof TipoAgendamento];

export const StatusAgendamento = {
  AGENDADO: 'AGENDADO',
  CONFIRMOU: 'CONFIRMOU',
  PRESENTE: 'PRESENTE',
  ENCAIXE: 'ENCAIXE',
  CANCELADO: 'CANCELADO',
  NAO_COMPARECEU: 'NAO_COMPARECEU',
  REALIZADO: 'REALIZADO',
  DESISTIU: 'DESISTIU',
  REMARCOU: 'REMARCOU',
} as const;

export type StatusAgendamento = (typeof StatusAgendamento)[keyof typeof StatusAgendamento];
