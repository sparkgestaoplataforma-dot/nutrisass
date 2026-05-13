import { Request, Response } from "express";
import {
  pegarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLida,
  criarNotificacao as criarNotificacaoService,
} from "./notificacao.service";

export async function buscar(
  req: Request<{ clinicaId: string; usuarioId: string }>,
  res: Response,
) {
  const { clinicaId, usuarioId } = req.params;
  const bucarNotificacoes = await pegarNotificacoes(
    clinicaId,
    usuarioId,
  );
  console.log(bucarNotificacoes);
  return res.json({
    sucess: true,
    data: bucarNotificacoes,
  });
}

export async function criarNotificacao(
  req: Request<{
    clinicaId: string;
    usuarioId: string;
    tipo: string;
    titulo: string;
  }>,
  res: Response,
) {
  const data = req.body;
  const criarNotificacaoResult = await criarNotificacaoService(data);

  return res.json({
    sucess: true,
    data: criarNotificacaoResult,
  });
}

export async function marcarComoLida(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;
  const notificacao = await marcarNotificacaoComoLida(id);
  return res.json({
    sucess: true,
    data: notificacao,
  });
}

export async function marcarTodasComoLida(
  req: Request<{ clinicaId: string; usuarioId: string }>,
  res: Response,
) {
  const { clinicaId, usuarioId } = req.params;
  const lerNotificacoes = await marcarTodasNotificacoesComoLida(
    clinicaId,
    usuarioId,
  );
  return res.json({
    sucess: true,
    data: lerNotificacoes,
  });
}
