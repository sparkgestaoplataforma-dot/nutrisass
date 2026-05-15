import { Router } from 'express';
import { createAgendamentoSchema, updateAgendamentoSchema, updateStatusSchema } from '@nutricao/shared';
import { validate } from '../../../shared/middlewares/validate.js';
import { authMiddleware, roleGuard } from '../../../shared/middlewares/auth.js';
import * as controller from './agenda.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createAgendamentoSchema), roleGuard('ADMIN', 'SECRETARIA'), controller.criar);
router.get('/', controller.listar);
router.put('/:id', validate(updateAgendamentoSchema), controller.editar);
router.patch('/:id/status', validate(updateStatusSchema), controller.alterarStatus);
router.delete('/:id', controller.excluir);

export { router as agendaRoutes };
