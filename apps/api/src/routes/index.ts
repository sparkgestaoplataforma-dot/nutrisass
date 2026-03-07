import { Router } from 'express';
import { authRoutes } from '../modules/auth/infra/auth.routes.js';
import { agendaRoutes } from '../modules/agenda/infra/agenda.routes.js';
import { pacientesRoutes } from '../modules/pacientes/infra/pacientes.routes.js';
import { conveniosRoutes } from '../modules/convenios/infra/convenios.routes.js';
import { prontuarioRoutes } from '../modules/prontuario/infra/prontuario.routes.js';
import { examesRoutes } from '../modules/exames/infra/exames.routes.js';
import { usuariosRoutes } from '../modules/usuarios/infra/usuarios.routes.js';
import { relatoriosRoutes } from '../modules/relatorios/infra/relatorios.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/agendamentos', agendaRoutes);
router.use('/pacientes', pacientesRoutes);
router.use('/convenios', conveniosRoutes);
router.use('/prontuario', prontuarioRoutes);
router.use('/exames', examesRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/relatorios', relatoriosRoutes);

export { router };
