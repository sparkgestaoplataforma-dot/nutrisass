import { Router } from "express";
import { authMiddleware } from '../../../shared/middlewares/auth.js';
import { getNotificacoesUsuario, limparNotificacoes } from "./notificacoes.controller.js";

const notificacaoRoutes = Router();

notificacaoRoutes.use(authMiddleware);

notificacaoRoutes.get('/usuario', getNotificacoesUsuario);
notificacaoRoutes.delete('/usuario', limparNotificacoes);

export { notificacaoRoutes };
