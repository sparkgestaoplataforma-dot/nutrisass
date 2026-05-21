import { Request, Response } from "express";
import { redisSet, redisLPush } from "@/shared/providers/redis";
import { getIO } from "@/shared/providers/socket";
import { listarnotificacoesUsuario, limparNotificacoesUsuario as limparService } from "./notificacoes.service";

interface NotificacaoData {
    id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    agendamentoId: string;
    createdAt: string;
}

export async function getNotificacoesUsuario(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
        throw new Error("Usuário não autenticado");
    }
    const notificacoes = await listarnotificacoesUsuario(userId);
    return res.json({
        success: true,
        data: notificacoes
    });
}

export async function enviarNotificacaoIndividual(notificacaoId: string, userId: string, nutricionistaId: string, data: NotificacaoData): Promise<void> {
    await redisSet(`notificacao:${notificacaoId}`, JSON.stringify(data));

    if (userId === nutricionistaId) {
        getIO()
            .to(`usuario:${userId}`)
            .emit("agenda:novo", data);
        await redisLPush(`usuario:${userId}:notificacoes`, notificacaoId);
        return
    }

    getIO().to(`usuario:${userId}`).emit("agenda:novo", data);
    getIO().to(`usuario:${nutricionistaId}`).emit("agenda:novo", data);

    await redisLPush(`usuario:${userId}:notificacoes`, notificacaoId);
    await redisLPush(`usuario:${nutricionistaId}:notificacoes`, notificacaoId);
}

export async function limparNotificacoes(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
        throw new Error("Usuário não autenticado");
    }
    
    await limparService(userId);
    
    getIO().to(`usuario:${userId}`).emit("agenda:limpar");
    
    return res.json({
        success: true,
        message: "Notificações removidas com sucesso"
    });
}