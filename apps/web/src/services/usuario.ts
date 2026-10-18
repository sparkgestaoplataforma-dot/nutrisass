import type { ApiResponse } from "@nutricao/shared";
import { api } from "./api";

export interface nutricionista{
    id: string,
    clinicaId: string,
    nome: string,
    email: string,
    senha: string,
    perfil: string,
    criadoEm: string,
    atualizadoEm: string
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
      // token,
      novaSenha,
    },
  );
  return res.data!;
}

export async function listarApenasNutricionistas(clinicaId: string){
  const { data: res } = await api.get<ApiResponse<nutricionista[]>>(
    `/usuarios/nutricionistas/clinicaId/${clinicaId!}`,
  );
  return res.data;
}
