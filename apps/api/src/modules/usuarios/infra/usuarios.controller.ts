import { Request, Response } from "express";
import { getClinicaId, getUsuarioId } from "@/shared/middlewares/auth";
import * as service from "./usuarios.service.js";

export async function meuPerfil(req: Request, res: Response) {
  const usuarioId = getUsuarioId(req);
  const clinicaId = getClinicaId(req);
  const perfil = await service.obterMeuPerfil(usuarioId, clinicaId);
  return res.json({ success: true, data: perfil });
}

export async function atualizarMeuPerfil(req: Request, res: Response) {
  const usuarioId = getUsuarioId(req);
  const clinicaId = getClinicaId(req);
  const perfil = await service.atualizarMeuPerfil(usuarioId, clinicaId, req.body);
  return res.json({ success: true, data: perfil });
}

export async function listar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const usuarios = await service.pegarUsuarios(clinicaId);
  return res.json({ success: true, data: usuarios });
}

export async function listarNutricionistas(req: Request<{ clinicaId: string }>, res: Response) {
  const { clinicaId } = req.params;
  const buscarNutricionistas = await service.pegarTodosNutricionistas(clinicaId);
  return res.json({
    success: true,
    data: buscarNutricionistas
  });
}

export async function criar(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const usuario = await service.criarUsuario(clinicaId, req.body);
  return res.status(201).json({ success: true, data: usuario });
}

export async function editar(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const usuario = await service.editarUsuario(id, clinicaId, req.body);
  return res.json({ success: true, data: usuario });
}

export async function excluir(req: Request<{ id: string }>, res: Response) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const resultado = await service.excluirUsuario(id, clinicaId);
  return res.json({ success: true, ...resultado });
}

export async function esqueciSenha(req: Request, res: Response) {
  const { email } = req.body;
  const resultado = await service.esqueciSenha(email);
  return res.json({ success: true, data: resultado });
}

export async function alterarSenha(req: Request, res: Response) {
  const { email, novaSenha } = req.body;
  const resultado = await service.alterarSenha(email, novaSenha);
  return res.json({ success: true, data: resultado });
}

