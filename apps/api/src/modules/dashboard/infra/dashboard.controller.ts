import { Request, Response } from "express";
import {
  getClinicaId,
  getUsuarioId,
} from "../../../shared/middlewares/auth.js";
import * as service from "./dashboard.service.js";

export async function getDashboard(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { nutricionistaId } = req.query;
  const usuarioId = getUsuarioId(req);
  const usuarioPerfil = req.user!.perfil;

  // Se for SECRETARIA:
  // - Se selecionou um nutri (nutricionistaId), usamos ele.
  // - Se selecionou "Todos" (vazio), usamos undefined para ver a clínica toda.
  // Se for NUTRICIONISTA:
  // - Usamos sempre o ID do token dele.
  const targetId = usuarioPerfil === 'SECRETARIA' 
    ? (nutricionistaId ? (nutricionistaId as string) : undefined)
    : usuarioId;

  const dados = await service.pegarDadosDashboard(
    clinicaId,
    targetId,
    usuarioPerfil,
  );

  return res.json({
    success: true,
    data: dados,
  });
}
