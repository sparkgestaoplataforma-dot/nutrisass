import { prisma } from "../../../shared/providers/prisma.js";
import { AppError } from "../../../shared/middlewares/errorHandler.js";
import { getIO } from "../../../shared/providers/socket";

export async function pegarNotificacoes(
  clinicaId: string,
  usuarioId: string,
) {
  try {
    const notificacoes = await prisma.notificacao.findMany({
      where: {
        clinicaId: clinicaId,
        usuarioId: usuarioId,
      },
      orderBy: {
        createAt: 'desc'
      }
    });
    
    return notificacoes;
  } catch (error) {
    throw new AppError("não foi possivel buscar por notificações", 500);
  }
}

export async function criarNotificacao(data: {
  clinicaId: string;
  usuarioId: string;
  tipo: 'LEMBRETE_CONSULTA' | 'PACIENTE_CHEGOU' | 'SISTEMA';
  titulo: string;
  mensagem?: string;
}) {
  try {
    const io = getIO()
    const notificacao = await prisma.notificacao.create({
      data: {
        clinicaId: data.clinicaId,
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        titulo: data.titulo,
        mensagem: data.mensagem,
      },
    });

    io.to(`user:${data.usuarioId}`).emit('notificacao:nova', notificacao);
    
    return notificacao;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw new AppError("não foi possivel criar a notificação", 500);
  }
}

export async function marcarNotificacaoComoLida(id: string) {
  try {
    const notificacao = await prisma.notificacao.findFirst({
      where: {
        id: id,
      },
    });

    if (!notificacao) {
      throw new AppError("notificação não encontrada", 404);
    }

    const novaMensagemLida = !notificacao.mensagemLida;

    await prisma.notificacao.update({
      where: {
        id: id,
      },
      data: {
        mensagemLida: novaMensagemLida,
      },
    });

    return `${notificacao.titulo} marcada como ${novaMensagemLida ? 'lida' : 'não lida'} com sucesso!`;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("não foi possivel atualizar a notificação!", 500);
  }
}

export async function marcarTodasNotificacoesComoLida(
  clinicaId: string,
  usuarioId: string,
) {
  try {
    await prisma.notificacao.updateMany({
      where: {
        clinicaId: clinicaId,
        usuarioId: usuarioId,
        mensagemLida: false
      },
      data: {
        mensagemLida: true,
      },
    });

    return `todas as notificações foram marcadas como lida com sucesso!`;
  } catch (error) {
    throw new AppError("não foi possivel marcar todas como lida", 500);
  }
}
