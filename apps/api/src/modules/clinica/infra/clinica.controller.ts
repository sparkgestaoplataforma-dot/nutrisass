import { Request, Response } from 'express';
import { getClinicaId, getUsuarioId } from '@/shared/middlewares/auth';
import * as clinicaService from './clinica.service';

export async function onboarding(req: Request, res: Response) {
  const data = await clinicaService.realizarOnboardingClinica(req.body);

  return res.status(201).json({
    success: true,
    data,
  });
}

export async function getClinica(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const clinica = await clinicaService.obterClinicaPorId(clinicaId);

  return res.json({ success: true, data: clinica });
}

export async function atualizarClinica(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const clinica = await clinicaService.atualizarDadosClinica(clinicaId, req.body);

  return res.json({ success: true, data: clinica });
}

export async function alterarTipoClinica(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const userId = getUsuarioId(req);
  const { tipo } = req.body;

  const data = await clinicaService.alterarModoClinica({
    clinicaId,
    userId,
    email: req.user!.email,
    tipo,
  });

  return res.json({
    success: true,
    data,
  });
}
