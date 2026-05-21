import { redisGet, redisLRange, redisDel } from "@/shared/providers/redis";
import type { Notificacao } from "@nutricao/shared";

export async function limparNotificacoesUsuario(userId: string): Promise<boolean> {
    const idNotificacoes = await redisLRange(`usuario:${userId}:notificacoes`, 0, -1);
    if (idNotificacoes.length > 0) {
        for (const id of idNotificacoes) {
            await redisDel(`notificacao:${id}`);
        }
        await redisDel(`usuario:${userId}:notificacoes`);
    }
    return true;
}

export async function listarNotificacoesUsuario(userId: string): Promise<Notificacao[]> {
    const idNotificacoes = await redisLRange(`usuario:${userId}:notificacoes`, 0, 20);

    const notificacoes = await Promise.all(
        idNotificacoes.map(async (notificacaoId) => {
            const raw = await redisGet(`notificacao:${notificacaoId}`);
            return raw ? (JSON.parse(raw) as Notificacao) : null;
        })
    );

    return notificacoes.filter((n): n is Notificacao => n !== null);
}