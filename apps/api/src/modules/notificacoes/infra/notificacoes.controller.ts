import { Request, Response } from "express";
import { redisSet, redisLPush } from "@/shared/providers/redis";
import { getIO } from "@/shared/providers/socket";
import { listarNotificacoesUsuario, limparNotificacoesUsuario as limparService } from "./notificacoes.service";
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
    await redisSet(`notificacao:${notificacaoId}`, JSON.stringify(data));

    if (userId === nutricionistaId) {
        getIO()
            .to(`usuario:${userId}`)
            .emit(SOCKET_EVENTS.AGENDA_NOVO, data);
        await redisLPush(`usuario:${userId}:notificacoes`, notificacaoId);
        return;
    }

    getIO().to(`usuario:${userId}`).emit(SOCKET_EVENTS.AGENDA_NOVO, data);
    getIO().to(`usuario:${nutricionistaId}`).emit(SOCKET_EVENTS.AGENDA_NOVO, data);

    await redisLPush(`usuario:${userId}:notificacoes`, notificacaoId);
    await redisLPush(`usuario:${nutricionistaId}:notificacoes`, notificacaoId);
}

export async function enviarNotificacaoClinica(
    notificacaoId: string,
    clinicaId: string,
    data: Notificacao
): Promise<void> {
    await redisSet(`notificacao:${notificacaoId}`, JSON.stringify(data));
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