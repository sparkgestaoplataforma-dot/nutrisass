import { Response, Request } from "express";
import * as service from "./avaliacoes.service.js";
export async function buscarPorId(req: Request<{ id: string }>, res: Response) {
  const id = req.params.id;

  const avaliacao = await service.pegarAvaliacaoPorId(id);

  return res.json({ success: true, data: avaliacao });
}

export async function buscarComRespostas(
  req: Request<{ id: string }>,
  res: Response,
) {
  const id = req.params.id;

  const avaliacao = await service.pegarAvaliacaoComRespostas(id);

  return res.json({ success: true, data: avaliacao });
}

export async function Exluir(req: Request<{ id: string }>, res: Response) {
  const id = req.params.id;

  await service.DeleteAvaliacao(id);

  return res
    .status(200)
    .json({ success: true, message: "Avaliação excluída com sucesso" });
}

export async function listarAvaliacoesPorPacienteId(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;

  const avaliacoes = await service.pegarAvaliacoesPorPacienteId(id);

  return res.json({ success: true, data: avaliacoes });
}
