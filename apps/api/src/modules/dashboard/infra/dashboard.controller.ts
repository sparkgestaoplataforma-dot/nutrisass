import { Request, Response } from 'express';
import { getClinicaId } from '../../../shared/middlewares/auth.js';
import * as service from './dashboard.service.js';

export async function getDashboard(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { nutricionistaId } = req.params;

  const dados = await service.pegarDadosDashboard(clinicaId, nutricionistaId as string);

  return res.json({
    success: true,
    data: dados,
  });
}
