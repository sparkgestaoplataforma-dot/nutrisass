import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.js";
import * as controller from "./avaliacoes.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/:id/respostas", controller.buscarPorId);

export { router as avaliacoesRoutes };