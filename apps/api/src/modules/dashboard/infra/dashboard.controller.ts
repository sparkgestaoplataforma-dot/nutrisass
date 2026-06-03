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

  // Se for AUTONOMO, forçar o próprio ID
  // Se for SECRETARIA (ou ADMIN), pode filtrar por nutri
  // Se for NUTRICIONISTA (Clínica), usa o próprio ID
  const isAutonomo = req.user!.tipoClinica === 'AUTONOMO';
  const targetId = isAutonomo
    ? usuarioId
    : (usuarioPerfil === 'SECRETARIA' || usuarioPerfil === 'ADMIN') 
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
