import { Router } from "express";
import { authMiddleware } from "@/shared/middlewares/auth";
import { getNotificacoesUsuario, limparNotificacoes, marcarNotificacaoComoLida, excluirNotificacaoUsuario, marcarTodasComoLidas } from "./notificacoes.controller.js";

const notificacaoRoutes = Router();

notificacaoRoutes.use(authMiddleware);

notificacaoRoutes.get('/usuario', getNotificacoesUsuario);
notificacaoRoutes.delete('/usuario', limparNotificacoes);
notificacaoRoutes.patch('/usuario/lidas', marcarTodasComoLidas);
notificacaoRoutes.patch('/usuario/:id/lida', marcarNotificacaoComoLida);
notificacaoRoutes.delete('/usuario/:id', excluirNotificacaoUsuario);

export { notificacaoRoutes };
