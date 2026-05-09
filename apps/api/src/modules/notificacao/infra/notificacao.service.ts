import { prisma } from "../../../shared/providers/prisma.js";
import { AppError } from "../../../shared/middlewares/errorHandler.js";

export async function buscarNotificacoesService(
  clinicaId: string,
  usuarioId: string,
) {
  try {
    const notificacoes = await prisma.notificacao.findMany({
      where: {
        clinicaId: clinicaId,
        usuarioId: usuarioId,
      },
    });
    if (!notificacoes) {
      throw new AppError("nenhuma notificação existente", 404);
    }

    return notificacoes;
  } catch (error) {
    throw new AppError("não foi possivel buscar por notificações", 500);
  }
}

export async function criarNotificacaoService(data: {
  clinicaId: string;
  usuarioId: string;
  tipo: string;
  titulo: string;
}) {
  try {
    const notificacao = await prisma.notificacao.create({
      data: {
        clinicaId: data.clinicaId,
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        titulo: data.titulo,
      },
    });

    return notificacao;
  } catch (error) {
    throw new AppError("não foi possivel criar a notificação", 500);
  }
}

export async function marcarComoLidaOuNaoLidaService(id: string) {
  try {
    const notificacao = await prisma.notificacao.findFirst({
      where: {
        id: id,
      },
    });

    if (notificacao!.mensagemLida === true) {
      await prisma.notificacao.update({
        where: {
          id: id,
        },
        data: {
          mensagemLida: false,
        },
      });

      return `${notificacao!.titulo} marcada como não lida com sucesso!`;
    }

    await prisma.notificacao.update({
      where: {
        id: id,
      },
      data: {
        mensagemLida: true,
      },
    });

    return `${notificacao!.titulo} marcada como lida com sucesso!`;
  } catch (error) {
    throw new AppError("não foi possivel buscar por notificação!", 500);
  }
}

export async function marcarTodasComoLidaService(
  clinicaId: string,
  usuarioId: string,
) {
  try {
    const notificacoes = await prisma.notificacao.updateMany({
      where: {
        clinicaId: clinicaId,
        usuarioId: usuarioId,
      },
      data: {
        mensagemLida: true,
      },
    });

    if (notificacoes.count === 0) {
      throw new AppError("notificações não encontradas", 404);
    }

    return `todas as notificaçÕes foram marcadas como lida com sucesso!`;
  } catch (error) {
    throw new AppError("não foi possivel buscar por notificações", 500);
  }
}
