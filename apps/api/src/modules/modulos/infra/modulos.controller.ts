import { Request, Response } from "express";
import { CreateModuloPerguntaInput } from "@nutricao/shared";
import * as service from "./modulos.service";
import { getClinicaId } from "../../../shared/middlewares/auth.js";

export async function criarPergunta(
  req: Request<{ moduloId: string }>,
  res: Response,
) {
  const clinicaId = getClinicaId(req);
  const { moduloId } = req.params;
  const payload = req.body as CreateModuloPerguntaInput;

  const pergunta = await service.criarPergunta(clinicaId, moduloId, payload);

  return res.status(201).json({ success: true, data: pergunta });
}
