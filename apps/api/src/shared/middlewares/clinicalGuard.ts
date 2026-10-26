import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

/**
 * Protege recursos clínicos (prontuário, avaliações, planos alimentares, exames de pacientes).
 * Deve ser usado SEMPRE após `authMiddleware`.
 *
 * - AUTONOMO: acesso total aos recursos da própria clínica (mesma regra do `roleGuard`).
 * - NUTRICIONISTA: acesso permitido.
 * - ADMIN, SECRETARIA e qualquer outro perfil: acesso negado (403).
 *
 * Não substitui o isolamento por `clinicaId`, que continua sendo aplicado nas consultas.
 */
export function clinicalGuard(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  if (req.user.tipoClinica === 'AUTONOMO') {
    return next();
  }

  if (req.user.perfil !== 'NUTRICIONISTA') {
    throw new AppError('Sem permissão para acessar registros clínicos', 403);
  }

  next();
}
