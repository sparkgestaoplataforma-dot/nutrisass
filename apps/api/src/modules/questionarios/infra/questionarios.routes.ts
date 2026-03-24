import { Router } from "express";
import { validate } from "../../../shared/middlewares/validate.js";
import { authMiddleware, roleGuard } from "../../../shared/middlewares/auth.js";
import * as controller from "./questionarios.controller";
import {
  createQuestionarioSchema,
  createQuestionarioModuloSchema,
  createQuestionarioRegrasInterpretacaoSchema,
  updateQuestionarioSchema,
} from "@nutricao/shared";

const router = Router();

router.get("/:id", controller.buscarPorId);

router.use(authMiddleware);

router.get("/", controller.listar);
router.post(
  "/",
  roleGuard("ADMIN", "NUTRICIONISTA"),
  validate(createQuestionarioSchema),
  controller.criar,
);
router.post(
  "/default",
  roleGuard("ADMIN", "NUTRICIONISTA"),
  controller.criarDefault,
);
router.post(
  "/:questionarioId/modulos",
  roleGuard("ADMIN", "NUTRICIONISTA"),
  validate(createQuestionarioModuloSchema),
  controller.adicionarModulo,
);
router.post(
  "/:questionarioId/regras",
  roleGuard("ADMIN", "NUTRICIONISTA"),
  validate(createQuestionarioRegrasInterpretacaoSchema),
  controller.adicionarRegra,
);
router.put(
  "/:id",
  roleGuard("ADMIN", "NUTRICIONISTA"),
  validate(updateQuestionarioSchema),
  controller.editar,
);
router.delete("/:id", roleGuard("ADMIN", "NUTRICIONISTA"), controller.excluir);

export { router as questionariosRoutes };
