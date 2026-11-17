import axios from "axios";
import { api } from "./api";
import type { ApiResponse, PaginatedResponse } from "@nutricao/shared";
import { formatarDataBrasilia } from "@/utils/date";

const publicApi = axios.create({
  baseURL: "/api",
});

export interface PacienteListItem {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  convenio: { id: string; nome: string } | null;
}

export type Convenio = {
  id: string;
  nome: string;
};

export type AgendamentoPaciente = {
  id: string;
  dataHora: string;
  tipo: "CONSULTA" | "RETORNO" | string;
  status: string;
  encaixe?: boolean;
  observacao?: string | null;
  convenio?: { nome: string } | null;
};

export type Agendamento = AgendamentoPaciente;

export type Paciente = {
  id: string;
  clinicaId: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  sexo: "MASCULINO" | "FEMININO" | null;
  dataNascimento: string | null;
  identidade: string | null;
  ufIdentidade: string | null;
  orgaoExpedidor: string | null;
  cpf: string | null;
  endereco: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
  profissao: string | null;
  escolaridade: string | null;
  nomeMae: string | null;
  convenioId: string | null;
  numeroCarteira: string | null;
  validadeCarteira: string | null;
  criadoEm: string;
  atualizadoEm: string;
  dataNascimentoFormatada?: string;
  criadoEmFormatada?: string;
  atualizadoEmFormatada?: string;
  convenio: Convenio | null;
  agendamentos: AgendamentoPaciente[];
};

export async function listarPacientes(busca?: string) {
  const { data: res } = await api.get<
    ApiResponse<PaginatedResponse<PacienteListItem>>
  >("/pacientes", { params: { busca, limit: 100 } });
  return res.data!;
}

export async function getPacientePorId(id: string) {
  const { data } = await api.get<ApiResponse<Paciente & { 
    dataNascimentoFormatada?: string;
    criadoEmFormatada?: string;
    atualizadoEmFormatada?: string;
  }>>(`/pacientes/${id}`);
  
  if (data.data) {
    data.data.dataNascimentoFormatada = formatarDataBrasilia(data.data.dataNascimento);
    data.data.criadoEmFormatada = formatarDataBrasilia(data.data.criadoEm);
    data.data.atualizadoEmFormatada = formatarDataBrasilia(data.data.atualizadoEm);
  }
  
  return data.data;
}

export async function buscarNomePacientePublico(id: string) {
  const { data } = await publicApi.get<ApiResponse<{ nome: string }>>(
    `/pacientes/${id}/nome`,
  );

  return data.data?.nome ?? "";
}

export async function criarPaciente(payload: Record<string, any>) {
  const { data } = await api.post("/pacientes", payload);
  return data.data as Paciente;
}

export async function editarPaciente(id: string, payload: Record<string, any>) {
  const { data } = await api.put(`/pacientes/${id}`, payload);
  return data.data as Paciente;
}

export async function excluirPaciente(id: string) {
  const { data } = await api.delete(`/pacientes/${id}`);
  return data;
}

