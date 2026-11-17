import type { ApiResponse, CreateUsuarioInput } from "@nutricao/shared";
import { api } from "./api";

export interface nutricionista {
  id: string;
  clinicaId: string;
  nome: string;
  email: string;
  senha: string;
  perfil: string;
  criadoEm: string;
  atualizadoEm: string;
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

export async function editarUsuario(id: string, payload: Partial<CreateUsuarioInput>) {
  const { data } = await api.put(`/usuarios/${id}`, payload);
  return data.data;
}

export async function excluirUsuario(id: string) {
  const { data } = await api.delete(`/usuarios/${id}`);
  return data;
}
