import { Request, Response } from "express";
import * as service from "./questionarios.service";
import { getClinicaId } from "../../../shared/middlewares/auth.js";

import {
  CreateQuestionarioInput,
  CreateQuestionarioModuloInput,
  CreateQuestionarioRegrasInterpretacaoInput,
  UpdateQuestionarioInput,
} from "@nutricao/shared";

function parseBooleanQuery(value: unknown) {
  return String(value).toLowerCase() === "true";
}

function parseNumberQuery(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const incluirDeletados = parseBooleanQuery(req.query.incluirDeletados);
  const page = parseNumberQuery(req.query.page, 1);
  const limit = parseNumberQuery(req.query.limit, 20);

  const resultado = await service.listar(clinicaId, {
    incluirDeletados,
    page,
    limit,
  });

  return res.json({ success: true, data: resultado });
}

export async function buscarPorId(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const incluirDeletados = parseBooleanQuery(req.query.incluirDeletados);

  const questionario = await service.listarModulosComPerguntas(id, {
    incluirDeletados,
  });

  return res.json({ success: true, data: questionario });
}

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

export async function criarDefault(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);

  const questionario = await service.criarQuestionarioDefault(clinicaId);

  return res.status(201).json({ success: true, data: questionario });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const payload = req.body as UpdateQuestionarioInput;

  const questionario = await service.editar(clinicaId, id, payload);

  return res.json({ success: true, data: questionario });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  await service.excluir(clinicaId, id);

  return res.json({ success: true, message: "Questionário excluído" });
}
