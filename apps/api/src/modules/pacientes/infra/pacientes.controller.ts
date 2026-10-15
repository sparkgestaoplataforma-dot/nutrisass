import { Request, Response } from "express";
import { getClinicaId } from "../../../shared/middlewares/auth.js";
import * as service from "./pacientes.service.js";
import {
  CreatePacienteQuestionarioAvaliacaoInput,
  pacienteIdParamSchema,
  listarPacientesQuerySchema,
} from "@nutricao/shared";

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const query = listarPacientesQuerySchema.parse(req.query);

  const paginatedResult = await service.listarPacientes(
    clinicaId,
    query.busca,
    query.page,
    query.limit,
  );

  return res.json({
    success: true,
    data: paginatedResult,
  });
}

export async function buscarPorId(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = pacienteIdParamSchema.parse(req.params);

  const paciente = await service.buscarPacientePorId(id, clinicaId);

  return res.json({ success: true, data: paciente });
}

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const paciente = await service.criarPaciente(clinicaId, req.body);

  return res.status(201).json({ success: true, data: paciente });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = pacienteIdParamSchema.parse(req.params);

  const paciente = await service.editarPaciente(id, clinicaId, req.body);

  return res.json({ success: true, data: paciente });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = pacienteIdParamSchema.parse(req.params);

  await service.excluirPaciente(id, clinicaId);

  return res.json({ success: true, message: "Paciente excluído" });
}

export async function criarAvaliacao(req: Request, res: Response) {
  const { id } = pacienteIdParamSchema.parse(req.params);
  const questionarioId = req.params.questionarioId as string;
  const payload = req.body as CreatePacienteQuestionarioAvaliacaoInput;

  const avaliacao = await service.criarAvaliacaoPaciente(
    id,
    questionarioId,
    payload,
  );

  return res.status(201).json({
    success: true,
    data: avaliacao,
    message: "Questionário preenchido com sucesso",
  });
}

export async function buscarNomePorId(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id } = pacienteIdParamSchema.parse(req.params);
  const nome = await service.pegarNomePacientePorId(id);

  return res.json({ success: true, data: { nome } });
}

export async function listarAvaliacoes(
  req: Request<{ id: string }>,
  res: Response,
) {
  const clinicaId = getClinicaId(req);
  const { id } = pacienteIdParamSchema.parse(req.params);
  const { page = "1", limit = "20" } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(Math.max(1, parseInt(limit as string, 10) || 20), 100);

  const paginatedResult = await service.pegarAvaliacoesPaciente(
    id,
    clinicaId,
    pageNum,
    limitNum,
  );

  return res.json({ success: true, data: paginatedResult });
}
