import { Router } from 'express';
import {
  createExameBaseSchema,
  solicitarExameSchema,
  registrarResultadoSchema,
  lancarExameExternoSchema,
} from '@nutricao/shared';
import { validate } from "@/shared/middlewares/validate";
import { authMiddleware } from "@/shared/middlewares/auth";
import { roleGuard } from "@/shared/middlewares/auth";
import { clinicalGuard } from "@/shared/middlewares/clinicalGuard";
import * as controller from './exames.controller.js';

const router = Router();

router.use(authMiddleware);

// Exames Base (config)
router.get('/base', controller.listarExamesBase);
router.post('/base', roleGuard('ADMIN', 'NUTRICIONISTA'), validate(createExameBaseSchema), controller.criarExameBase);
router.put('/base/:id', roleGuard('ADMIN', 'NUTRICIONISTA'), controller.editarExameBase);
router.delete('/base/:id', roleGuard('ADMIN'), controller.excluirExameBase);

// Solicitações por paciente
router.get('/paciente/:pacienteId', clinicalGuard, controller.listarSolicitacoes);
router.post('/paciente/:pacienteId', clinicalGuard, validate(solicitarExameSchema), controller.solicitarExame);
router.post('/paciente/:pacienteId/externo', clinicalGuard, validate(lancarExameExternoSchema), controller.lancarExameExterno);
router.delete('/:id', clinicalGuard, controller.excluirSolicitacao);

// Resultado
router.post('/resultado', clinicalGuard, validate(registrarResultadoSchema), controller.registrarResultado);

export { router as examesRoutes };
