import { Request, Response } from "express";
import { getClinicaId } from "@/shared/middlewares/auth";
import * as service from "./pacientes.service";
import { CreatePacienteQuestionarioAvaliacaoInput } from "@nutricao/shared";

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { busca, page = "1", limit = "20" } = req.query;

  const data = await service.listarPacientesClinica(clinicaId, {
    busca: busca as string | undefined,
    page: Number(page),
    limit: Number(limit),
  });

  return res.json({
    success: true,
    data,
  });
}

export async function buscarPorId(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const paciente = await service.buscarPacientePorId(id, clinicaId);
  return res.json({ success: true, data: paciente });
}

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);

  const paciente = await service.criarPacienteClinica(clinicaId, req.body);
  return res.status(201).json({ success: true, data: paciente });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  const paciente = await service.editarPacienteClinica(id, clinicaId, req.body);
  return res.json({ success: true, data: paciente });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  await service.excluirPacienteClinica(id, clinicaId);
  return res.json({ success: true, message: "Paciente excluído" });
}

export async function criarAvaliacao(req: Request, res: Response) {
  const payload = req.body as CreatePacienteQuestionarioAvaliacaoInput;
  const id = req.params.id as string;
  const questionarioId = req.params.questionarioId as string;

  const avaliacao = await service.criarAvaliacaoPaciente(id, questionarioId, payload);

  return res.status(201).json({
    success: true,
    data: avaliacao,
    message: "Questionário preenchido com sucesso",
  });
}

export async function buscarNomePorId(req: Request<{ id: string }>, res: Response) {
  const id = req.params.id as string;

  const nome = await service.pegarNomePacientePorId(id);

  return res.json({ success: true, data: { nome } });
}

export async function listarAvaliacoes(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const { page = "1", limit = "20" } = req.query;

  const pageNum = Number(page);
  const limitNum = Number(limit);

  const paginatedResult = await service.pegarAvaliacoesPaciente(
    id,
    clinicaId,
    pageNum,
    limitNum,
  );

  return res.json({ success: true, data: paginatedResult });
}
