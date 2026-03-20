import { Router } from "express";
import { validate } from "../../../shared/middlewares/validate.js";
import { authMiddleware, roleGuard } from "../../../shared/middlewares/auth.js";
import { createModuloPerguntaSchema } from "@nutricao/shared";
import * as controller from "./modulos.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/:moduloId/perguntas",
  roleGuard("ADMIN", "NUTRICIONISTA"),
  validate(createModuloPerguntaSchema),
  controller.criarPergunta,
);

export { router as modulosRoutes };
