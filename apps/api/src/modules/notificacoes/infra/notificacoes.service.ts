import { redisGet, redisLRange, redisDel } from "@/shared/providers/redis"

export const limparNotificacoesUsuario = async (userId: string) => {
    const iDNotificacoesDoUsuario = await redisLRange(`usuario:${userId}:notificacoes`, 0, -1);
    if (iDNotificacoesDoUsuario && iDNotificacoesDoUsuario.length > 0) {
        for (const id of iDNotificacoesDoUsuario) {
            await redisDel(`notificacao:${id}`);
        }
        await redisDel(`usuario:${userId}:notificacoes`);
    }
    return true;
}

export const listarnotificacoesUsuario = async (userId: string) => {

    const iDNotificacoesDoUsuario = await redisLRange(`usuario:${userId}:notificacoes`, 0, 20);

    const notificacoesDoUsuario = await Promise.all(
        iDNotificacoesDoUsuario!.map(async (notificacaoId) => {
            const notificacao = await redisGet(`notificacao:${notificacaoId}`)
            return notificacao ? JSON.parse(notificacao) : null
        })
    )

    return notificacoesDoUsuario.filter(Boolean);
}