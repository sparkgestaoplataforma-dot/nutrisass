import { Request, Response } from "express";
import { redisSet, redisLPush } from "@/shared/providers/redis";
import { getIO } from "@/shared/providers/socket";
import { listarNotificacoesUsuario, limparNotificacoesUsuario as limparService, marcarTodasComoLidas as marcarTodasService } from "./notificacoes.service.js";
import type { Notificacao } from "@nutricao/shared";
import { SOCKET_EVENTS } from "@nutricao/shared";

export async function getNotificacoesUsuario(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
        throw new Error("Usuário não autenticado");
    }
    const notificacoes = await listarNotificacoesUsuario(userId);
    return res.json({
        success: true,
        data: notificacoes
    });
}

export async function enviarNotificacaoIndividual(
    notificacaoId: string,
    userId: string,
    nutricionistaId: string,
    data: Notificacao
): Promise<void> {
    // 1. Persistência da notificação global (com TTL)
    await redisSet(`notificacao:${notificacaoId}`, JSON.stringify(data), 'EX', 2592000);

    // 2. Persistir na lista de notificações APENAS do nutricionista alvo
    await redisLPush(`usuario:${nutricionistaId}:notificacoes`, notificacaoId);

    // 3. Emitir evento realtime via Socket.io
    if (userId === nutricionistaId) {
        // Se o usuário for o próprio nutricionista, envia apenas para ele
        getIO().to(`usuario:${nutricionistaId}`).emit(SOCKET_EVENTS.AGENDA_NOVO, data);
    } else {
        // Se for outra pessoa criando, envia o popup para quem criou (userId) e para o nutricionista (nutricionistaId)
        getIO().to(`usuario:${userId}`).emit(SOCKET_EVENTS.AGENDA_NOVO, data);
        getIO().to(`usuario:${nutricionistaId}`).emit(SOCKET_EVENTS.AGENDA_NOVO, data);
    }
}

export async function enviarNotificacaoClinica(
    notificacaoId: string,
    clinicaId: string,
    data: Notificacao
): Promise<void> {
    await redisSet(`notificacao:${notificacaoId}`, JSON.stringify(data), 'EX', 2592000);
    await redisLPush(`clinica:${clinicaId}:notificacoes`, notificacaoId);

    getIO()
        .to(`clinica:${clinicaId}`)
        .emit(SOCKET_EVENTS.AGENDA_NOVO, data);
}

export async function limparNotificacoes(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
        throw new Error("Usuário não autenticado");
    }

    await limparService(userId);

    getIO().to(`usuario:${userId}`).emit(SOCKET_EVENTS.NOTIFICACOES_LIMPAR);

    return res.json({
        success: true,
        message: "Notificações removidas com sucesso"
    });
}

import { redisSAdd } from "@/shared/providers/redis.js";

export async function marcarNotificacaoComoLida(req: Request, res: Response) {
    const userId = req.user?.userId;
    const id = req.params.id;

    if (!userId) {
        throw new Error("Usuário não autenticado");
    }

    await redisSAdd(`usuario:${userId}:notificacoes:lidas`, String(id));

    return res.json({
        success: true,
        message: "Notificação marcada como lida"
    });
}

export async function excluirNotificacaoUsuario(req: Request, res: Response) {
    const userId = req.user?.userId;
    const id = req.params.id;

    if (!userId) {
        throw new Error("Usuário não autenticado");
    }

    await redisSAdd(`usuario:${userId}:notificacoes:removidas`, String(id));

    return res.json({
        success: true,
        message: "Notificação removida com sucesso"
    });
}

export async function marcarTodasComoLidas(req: Request, res: Response) {
    const userId = req.user?.userId;

    if (!userId) {
        throw new Error("Usuário não autenticado");
    }

    await marcarTodasService(userId);

    return res.json({
        success: true,
        message: "Todas as notificações marcadas como lidas"
    });
}
