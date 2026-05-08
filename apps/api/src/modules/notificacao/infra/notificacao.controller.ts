import {Request, Response} from "express";
import { buscarNotificacoesService, marcarComoLidaOuNaoLidaService, marcarTodasComoLidaService, criarNotificacaoService } from "./notificacao.service";


export async function buscarTodasNotificações(  req: Request<{clinicaId: string, usuarioId: string}>, res: Response ){
    const {clinicaId, usuarioId} = req.params;
    const bucarNotificacoes = await buscarNotificacoesService(clinicaId, usuarioId);
    console.log(bucarNotificacoes)
    return res.json({
        sucess: true,
        data: bucarNotificacoes
    })
}

export async function marcarComoLidaOuNaoLida(  req: Request<{id : string}>, res: Response ){
    const {id} = req.params;
    const notificacao = await marcarComoLidaOuNaoLidaService(id);
        return res.json({
        sucess: true,
        data: notificacao
    })
}

export async function marcarTodasComoLida(  req: Request<{clinicaId: string, usuarioId: string}>, res: Response ){
    const {clinicaId, usuarioId} = req.params;
   const lerNotificacoes = await marcarTodasComoLidaService(clinicaId, usuarioId)
       return res.json({
        sucess: true,
        data: lerNotificacoes
    })
}
