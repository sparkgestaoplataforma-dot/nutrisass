import { Request, Response } from 'express';
import { getClinicaId } from '@/shared/middlewares/auth';
import * as conveniosService from './convenios.service';

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const search = (req.query.search || req.query.busca || req.query.q) as string | undefined;

  const result = await conveniosService.listarConvenios(clinicaId, {
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

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const convenio = await conveniosService.criarConvenio(clinicaId, req.body);
  return res.status(201).json({ success: true, data: convenio });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const convenio = await conveniosService.editarConvenio(id, clinicaId, req.body);
  return res.json({ success: true, data: convenio });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  await conveniosService.excluirConvenio(id, clinicaId);
  return res.json({ success: true, message: 'Convênio excluído' });
}
