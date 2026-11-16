import { Request, Response } from 'express';
import { getClinicaId } from '@/shared/middlewares/auth';
import * as relatoriosService from './relatorios.service';

export async function gerarRelatorio(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const { dataInicio, dataFim, status, convenioId } = req.query;

  const data = await relatoriosService.gerarRelatorioAgendamentos(clinicaId, {
    dataInicio: dataInicio as string | undefined,
    dataFim: dataFim as string | undefined,
    status: status as string | undefined,
    convenioId: convenioId as string | undefined,
  });

  return res.json({
    success: true,
    data,
  });
}
