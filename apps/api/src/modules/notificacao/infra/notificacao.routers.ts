import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.js";
import * as controller from "./notificacao.controller.js";

const router = Router();
router.use(authMiddleware);

router.get(
  "/clinica/:clinicaId/usuario/:usuarioId",
  controller.buscarTodasNotificações,
);
router.post(
  "clinica/:clinicaId/usuario/:usuarioId",
  controller.criarNotificacao,
);
router.put("/:id", controller.marcarComoLidaOuNaoLida);
router.put(
  "/clinica/:clinicaId/usuario/:usuarioId",
  controller.marcarTodasComoLida,
);

export { router as notificacaoRoutes };
