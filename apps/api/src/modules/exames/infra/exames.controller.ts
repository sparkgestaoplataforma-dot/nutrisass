import { Request, Response } from 'express';
import { getClinicaId } from '@/shared/middlewares/auth';
import * as examesService from './exames.service';

// Exames Base (config)
export async function listarExamesBase(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { tipo } = req.query;
  const search = (req.query.search || req.query.busca || req.query.q) as string | undefined;

  const result = await examesService.listarExamesBase(clinicaId, {
    tipo: tipo as string | undefined,
    search,
    page: parseInt(req.query.page as string, 10) || 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    hasExplicitPage: Boolean(req.query.page),
  });

  return res.json({
    success: true,
    ...result,
  });
}

export async function criarExameBase(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const exame = await examesService.criarExameBase(clinicaId, req.body);
  return res.status(201).json({ success: true, data: exame });
}

export async function editarExameBase(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const exame = await examesService.editarExameBase(id, clinicaId, req.body);
  return res.json({ success: true, data: exame });
}

export async function excluirExameBase(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  await examesService.excluirExameBase(id, clinicaId);
  return res.json({ success: true, message: 'Exame excluído' });
}

// Solicitações de Exame (por paciente)
export async function listarSolicitacoes(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  const solicitacoes = await examesService.listarSolicitacoesPaciente(pacienteId, clinicaId);
  return res.json({ success: true, data: solicitacoes });
}

export async function solicitarExame(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;
  const { exameBaseIds } = req.body;

  const solicitacao = await examesService.solicitarExamePaciente(
    pacienteId,
    clinicaId,
    exameBaseIds,
  );
  return res.status(201).json({ success: true, data: solicitacao });
}

export async function lancarExameExterno(req: Request<{ pacienteId: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { pacienteId } = req.params;

  const solicitacao = await examesService.lancarExameExternoPaciente(
    pacienteId,
    clinicaId,
    req.body,
  );
  return res.status(201).json({ success: true, data: solicitacao });
}

export async function registrarResultado(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);

  const updated = await examesService.registrarResultadoExame(clinicaId, req.body);
  return res.json({ success: true, data: updated });
}

export async function excluirSolicitacao(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;

  await examesService.excluirSolicitacaoExame(id, clinicaId);
  return res.json({ success: true, message: 'Solicitação excluída' });
}
