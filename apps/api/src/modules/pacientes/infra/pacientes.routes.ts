import { Router } from "express";
import {
  createPacienteSchema,
  updatePacienteSchema,
  createPacienteQuestionarioAvaliacaoSchema,
} from "@nutricao/shared";

import { validate } from "@/shared/middlewares/validate";
import { authMiddleware } from "@/shared/middlewares/auth";
import { clinicalGuard } from "@/shared/middlewares/clinicalGuard";
import { publicRateLimiter } from "@/shared/middlewares/rateLimiter";
import * as controller from "./pacientes.controller.js";

const router = Router();

// Rotas públicas
router.post(
  "/:id/questionarios/:questionarioId/avaliacoes",
  publicRateLimiter,
  validate(createPacienteQuestionarioAvaliacaoSchema),
  controller.criarAvaliacao,
);

router.get("/:id/nome", controller.buscarNomePorId);

// Rotas autenticadas
router.use(authMiddleware);

router.get("/", controller.listar);
router.get("/:id/avaliacoes", clinicalGuard, controller.listarAvaliacoes);
router.get("/:id", controller.buscarPorId);
router.post("/", validate(createPacienteSchema), controller.criar);
router.put("/:id", validate(updatePacienteSchema), controller.editar);
router.delete("/:id", controller.excluir);

export { router as pacientesRoutes };
