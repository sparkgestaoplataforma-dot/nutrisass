import { redisGet, redisLRange, redisSMembers, redisSAdd } from "@/shared/providers/redis.js";
import type { Notificacao } from "@nutricao/shared";

export async function limparNotificacoesUsuario(userId: string): Promise<boolean> {
    const idNotificacoes = await redisLRange(`usuario:${userId}:notificacoes`, 0, -1);
    
    if (idNotificacoes.length > 0) {
        for (const id of idNotificacoes) {
            await redisSAdd(`usuario:${userId}:notificacoes:removidas`, id);
        }
    }

    return true;
}

export async function marcarTodasComoLidas(userId: string): Promise<boolean> {
    const idNotificacoes = await redisLRange(`usuario:${userId}:notificacoes`, 0, -1);
    
    if (idNotificacoes.length > 0) {
        for (const id of idNotificacoes) {
            await redisSAdd(`usuario:${userId}:notificacoes:lidas`, id);
        }
    }

    return true;
}

export async function listarNotificacoesUsuario(userId: string): Promise<Notificacao[]> {
    const idNotificacoes = await redisLRange(`usuario:${userId}:notificacoes`, 0, 20);

    const removidas = new Set(await redisSMembers(`usuario:${userId}:notificacoes:removidas`));
    const lidas = new Set(await redisSMembers(`usuario:${userId}:notificacoes:lidas`));

    const notificacoes = await Promise.all(
        idNotificacoes
            .filter(id => !removidas.has(id))
            .map(async (notificacaoId) => {
                const raw = await redisGet(`notificacao:${notificacaoId}`);
                if (!raw) return null;

                const parsed = JSON.parse(raw) as Notificacao;
                parsed.lida = lidas.has(notificacaoId);
                return parsed;
            })
    );

    return notificacoes.filter((n): n is Notificacao => n !== null);
}