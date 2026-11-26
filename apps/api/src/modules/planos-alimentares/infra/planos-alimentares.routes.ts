import { Router } from "express";
import {
  createPlanoAlimentarSchema,
  updatePlanoAlimentarSchema,
  listPlanosAlimentaresQuerySchema,
} from "@nutricao/shared";
import { validate, validateQuery } from "@/shared/middlewares/validate";
import { authMiddleware } from "@/shared/middlewares/auth";
import { clinicalGuard } from "@/shared/middlewares/clinicalGuard";
import * as controller from "./planos-alimentares.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(clinicalGuard);

router.get("/", validateQuery(listPlanosAlimentaresQuerySchema), controller.listar);
router.get("/:id", controller.buscarPorId);
router.post("/", validate(createPlanoAlimentarSchema), controller.criar);
router.put("/:id", validate(updatePlanoAlimentarSchema), controller.editar);
router.delete("/:id", controller.excluir);

export { router as planosAlimentaresRoutes };
