import { Router } from "express";
import { alimentoSchema } from "@nutricao/shared";
import { validate } from "@/shared/middlewares/validate";
import { authMiddleware } from "@/shared/middlewares/auth";
import * as controller from "./alimentos.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.post("/", validate(alimentoSchema), controller.criar);
router.put("/:id", validate(alimentoSchema), controller.atualizar);
router.delete("/:id", controller.excluir);

export { router as alimentosRoutes };
