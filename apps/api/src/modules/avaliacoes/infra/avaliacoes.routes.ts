import { Router } from "express";
import { authMiddleware } from "@/shared/middlewares/auth";
import { clinicalGuard } from "@/shared/middlewares/clinicalGuard";
import * as controller from "./avaliacoes.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(clinicalGuard);

router.get("/:id", controller.buscarPorId);
router.get("/:id/questionario", controller.buscarComRespostas);

router.delete("/:id", controller.excluir);
export { router as avaliacoesRoutes };
