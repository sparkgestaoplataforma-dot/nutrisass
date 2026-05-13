import { Router } from "express";
import { createPlanoAlimentarSchema, updatePlanoAlimentarSchema } from "@nutricao/shared";
import { validate } from "../../../shared/middlewares/validate.js";
import { authMiddleware, roleGuard } from "../../../shared/middlewares/auth.js";
import * as controller from "./planos-alimentares.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.post("/", roleGuard("NUTRICIONISTA"), validate(createPlanoAlimentarSchema), controller.criar);
router.put("/:id", roleGuard("NUTRICIONISTA"), validate(updatePlanoAlimentarSchema), controller.editar);
router.delete("/:id", roleGuard("NUTRICIONISTA"), controller.excluir);

export { router as planosAlimentaresRoutes };
