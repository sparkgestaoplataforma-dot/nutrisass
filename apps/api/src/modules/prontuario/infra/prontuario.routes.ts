import { Router } from 'express';
import { createEvolucaoSchema, createMedidaSchema } from '@nutricao/shared';
import { validate } from "@/shared/middlewares/validate";
import { authMiddleware } from "@/shared/middlewares/auth";
import { clinicalGuard } from "@/shared/middlewares/clinicalGuard";
import * as controller from './prontuario.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(clinicalGuard);

// Evoluções
router.get('/:pacienteId/evolucoes', controller.listarEvolucoes);
router.post('/:pacienteId/evolucoes', validate(createEvolucaoSchema), controller.criarEvolucao);
router.put('/evolucoes/:id', controller.editarEvolucao);
router.delete('/evolucoes/:id', controller.excluirEvolucao);

// Medidas
router.get('/:pacienteId/medidas', controller.listarMedidas);
router.post('/:pacienteId/medidas', validate(createMedidaSchema), controller.criarMedida);
router.put('/medidas/:id', controller.editarMedida);
router.delete('/medidas/:id', controller.excluirMedida);

export { router as prontuarioRoutes };
