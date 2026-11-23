import { Router } from "express";
import { createUsuarioSchema, updateUsuarioSchema, updateMeuPerfilSchema } from "@nutricao/shared";
import { validate } from "@/shared/middlewares/validate";
import { authMiddleware, roleGuard } from "@/shared/middlewares/auth";
import * as controller from "./usuarios.controller.js";

const router = Router();
router.post("/esqueci-senha", controller.esqueciSenha);
router.post("/redefinir-senha", controller.alterarSenha);

router.use(authMiddleware);

// Perfil do próprio usuário autenticado (todos os perfis e modo AUTONOMO)
router.get("/meu-perfil", controller.meuPerfil);
router.put("/meu-perfil", validate(updateMeuPerfilSchema), controller.atualizarMeuPerfil);

// Listagem de nutricionistas (todos os perfis precisam para filtros de UI)
router.get("/nutricionistas/clinicaId/:clinicaId", roleGuard("ADMIN", "NUTRICIONISTA", "SECRETARIA"), controller.listarNutricionistas);

// Gerenciamento de usuários (ADMIN e SECRETARIA)
router.get("/", roleGuard("ADMIN", "SECRETARIA"), controller.listar);
router.post("/", validate(createUsuarioSchema), roleGuard("ADMIN", "SECRETARIA"), controller.criar);
router.put("/:id", validate(updateUsuarioSchema), roleGuard("ADMIN", "SECRETARIA"), controller.editar);
router.delete("/:id", roleGuard("ADMIN"), controller.excluir);

export { router as usuariosRoutes };
