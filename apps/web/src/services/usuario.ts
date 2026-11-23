import type {
  ApiResponse,
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UpdateMeuPerfilInput,
} from "@nutricao/shared";
import { api } from "./api";

export interface nutricionista {
  id: string;
  clinicaId: string;
  nome: string;
  email: string;
  senha: string;
  perfil: string;
  crn?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface MeuPerfil {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  crn: string | null;
}

export async function obterMeuPerfil(): Promise<MeuPerfil> {
  const { data } = await api.get<ApiResponse<MeuPerfil>>("/usuarios/meu-perfil");
  return data.data!;
}

export async function atualizarMeuPerfil(payload: UpdateMeuPerfilInput): Promise<MeuPerfil> {
  const { data } = await api.put<ApiResponse<MeuPerfil>>("/usuarios/meu-perfil", payload);
  return data.data!;
}

export async function esqueciSenha(email: string) {
  const { data: res } = await api.post<ApiResponse>("/usuarios/esqueci-senha", {
    email,
  });
  return res.data!;
}

export async function redefinirSenha(novaSenha: string) {
  const { data: res } = await api.post<ApiResponse>(
    "/usuarios/redefinir-senha",
    {
      novaSenha,
    },
  );
  return res.data!;
}

export async function listarApenasNutricionistas(clinicaId: string) {
  const { data: res } = await api.get<ApiResponse<nutricionista[]>>(
    `/usuarios/nutricionistas/clinicaId/${clinicaId!}`,
  );
  return res.data!;
}

export async function listarUsuarios() {
  const { data } = await api.get("/usuarios");
  return data.data;
}

export async function criarUsuario(payload: CreateUsuarioInput) {
  const { data } = await api.post("/usuarios", payload);
  return data.data;
}

export async function editarUsuario(id: string, payload: UpdateUsuarioInput) {
  const { data } = await api.put(`/usuarios/${id}`, payload);
  return data.data;
}

export async function excluirUsuario(id: string) {
  const { data } = await api.delete(`/usuarios/${id}`);
  return data;
}
