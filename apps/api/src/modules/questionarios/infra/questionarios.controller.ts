import { Request, Response } from "express";
import * as service from "./questionarios.service";
import { getClinicaId } from "../../../shared/middlewares/auth.js";

import {
  CreateQuestionarioInput,
  CreateQuestionarioModuloInput,
  CreateQuestionarioRegrasInterpretacaoInput,
} from "@nutricao/shared";

export async function criar(req: Request, res: Response) {
  const payload = req.body as CreateQuestionarioInput;
  const clinicaId = getClinicaId(req);

  const questionario = await service.criar(clinicaId, payload);

  return res.status(201).json({ success: true, data: questionario });
}

export async function adicionarModulo(
  req: Request<{ questionarioId: string }>,
  res: Response,
) {
  const clinicaId = getClinicaId(req);
  const { questionarioId } = req.params;
  const payload = req.body as CreateQuestionarioModuloInput;

  const modulo = await service.adicionarModulo(
    clinicaId,
    questionarioId,
    payload,
  );

  return res.status(201).json({ success: true, data: modulo });
}

export async function adicionarRegra(
  req: Request<{ questionarioId: string }>,
  res: Response,
) {
  const clinicaId = getClinicaId(req);
  const { questionarioId } = req.params;
  const payload = req.body as CreateQuestionarioRegrasInterpretacaoInput;

  const regra = await service.adicionarRegra(
    clinicaId,
    questionarioId,
    payload,
  );

  return res.status(201).json({ success: true, data: regra });
}
