import { Router } from 'express';
import { createPacienteSchema, updatePacienteSchema } from '@nutricao/shared';
import { validate } from '../../../shared/middlewares/validate.js';
import { authMiddleware } from '../../../shared/middlewares/auth.js';
import * as controller from './pacientes.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.post('/', validate(createPacienteSchema), controller.criar);
router.put('/:id', validate(updatePacienteSchema), controller.editar);
router.delete('/:id', controller.excluir);

export { router as pacientesRoutes };
