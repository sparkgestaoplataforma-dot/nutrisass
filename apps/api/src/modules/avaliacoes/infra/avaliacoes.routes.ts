import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.js";
import { clinicalGuard } from "../../../shared/middlewares/clinicalGuard.js";
import * as controller from "./avaliacoes.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(clinicalGuard);

router.get("/:id", controller.buscarPorId);
router.get("/:id/questionario", controller.buscarComRespostas);

router.delete("/:id", controller.excluir);
export { router as avaliacoesRoutes };
