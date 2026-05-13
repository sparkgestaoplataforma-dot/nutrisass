import { Request, Response } from "express";
import * as service from "./alimentos.service.js";
import { getClinicaId } from "@/shared/middlewares/auth.js";

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { q, page, limit } = req.query;

  const result = await service.pegarAlimentos(
    clinicaId,
    q as string,
    page ? Number(page) : 1,
    limit ? Number(limit) : 20,
  );

  res.json({ success: true, ...result });
}

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const alimento = await service.criarAlimento(clinicaId, req.body);
  res.status(201).json({ success: true, data: alimento });
}

export async function buscarPorId(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const alimento = await service.pegarAlimentoPorId(id as string, clinicaId);
  res.json({ success: true, data: alimento });
}
