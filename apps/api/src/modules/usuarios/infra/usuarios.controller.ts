import { Request, Response } from "express";
import { getClinicaId } from "../../../shared/middlewares/auth.js";
import * as service from "./usuarios.service.js";

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const usuarios = await service.ListarUsuarios(clinicaId);
  return res.json({ success: true, data: usuarios });
}

export async function listarNutricionistas(req: Request<{ clinicaId: string }>, res: Response) {
  const { clinicaId } = req.params;
  const buscarNutricionistas = await service.ListarTodosNutricionistas(clinicaId);
  return res.json({
    success: true,
    data: buscarNutricionistas
  });
}

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const usuario = await service.CriarUsuario(clinicaId, req.body);
  return res.status(201).json({ success: true, data: usuario });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const usuario = await service.EditarUsuario(id, clinicaId, req.body);
  return res.json({ success: true, data: usuario });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const resultado = await service.ExcluirUsuario(id, clinicaId);
  return res.json({ success: true, ...resultado });
}

export async function esqueciSenha(req: Request, res: Response) {
  const { email } = req.body;
  const resultado = await service.EsqueciSenha(email);
  return res.json({ success: true, data: resultado });
}

export async function alterarSenha(req: Request, res: Response) {
  const { email, novaSenha } = req.body;
  const resultado = await service.AlterarSenha(email, novaSenha);
  return res.json({ success: true, data: resultado });
}

