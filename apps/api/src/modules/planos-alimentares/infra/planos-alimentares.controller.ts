import { Request, Response } from "express";
import { getClinicaId, getUsuarioId } from "../../../shared/middlewares/auth.js";
import * as service from "./planos-alimentares.service.js";

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const usuarioId = getUsuarioId(req);

  const plano = await service.criar(clinicaId, usuarioId, req.body);

  return res.status(201).json({ success: true, data: plano });
}

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.query;

  const planos = await service.listar(clinicaId, pacienteId as string | undefined);

  return res.json({ success: true, data: planos });
}

export async function buscarPorId(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const plano = await service.buscarPorId(id, clinicaId);

  return res.json({ success: true, data: plano });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const plano = await service.atualizar(id, clinicaId, req.body);

  return res.json({ success: true, data: plano });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  await service.deletar(id, clinicaId);

  return res.json({ success: true, message: "Plano alimentar excluído com sucesso" });
}
