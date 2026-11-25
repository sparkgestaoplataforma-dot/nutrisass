import { Request, Response } from "express";
import { getClinicaId, getUsuarioId } from "@/shared/middlewares/auth";
import * as service from "./planos-alimentares.service.js";

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const usuarioId = getUsuarioId(req);

  const plano = await service.criarPlanoAlimentar(clinicaId, usuarioId, req.body);

  return res.status(201).json({ success: true, data: plano });
}

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId, isTemplate } = req.query;

  const planos =
    isTemplate !== undefined
      ? await service.pegarPlanosAlimentares(
          clinicaId,
          pacienteId as string | undefined,
          isTemplate === "true",
        )
      : await service.pegarPlanosAlimentares(clinicaId, pacienteId as string | undefined);

  return res.json({ success: true, data: planos });
}

export async function buscarPorId(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const plano = await service.pegarPlanoAlimentarPorId(id, clinicaId);

  return res.json({ success: true, data: plano });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const plano = await service.editarPlanoAlimentar(id, clinicaId, req.body);

  return res.json({ success: true, data: plano });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  await service.excluirPlanoAlimentar(id, clinicaId);

  return res.json({ success: true, message: "Plano alimentar excluído com sucesso" });
}
