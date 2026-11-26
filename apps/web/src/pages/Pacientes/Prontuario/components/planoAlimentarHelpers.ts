import type { ZodError } from "zod";
import type {
  CreatePlanoAlimentarInput,
  UpdatePlanoAlimentarInput,
  TokenPayload,
} from "@nutricao/shared";
import type { PlanoAlimentarAPI } from "@/services/planoAlimentar";
import { hidratarAlimentoSalvo, type AlimentoCalculavel } from "@/utils/nutricaoCalculos";

export const MAX_OPCOES_REFEICAO = 10;

export interface OpcaoLocal {
  _uid: string;
  nome: string | null;
  ordem: number;
  alimentos: AlimentoCalculavel[];
}

export interface RefeicaoLocal {
  _uid: string;
  nome: string;
  horario: string;
  ordem: number;
  opcoes: OpcaoLocal[];
  _activeOpcao: number;
}

export interface EstadoFormularioPlano {
  titulo: string;
  objetivo: string;
  observacoes: string;
  metaCalorias: string;
  metaProteinas: string;
  metaCarboidratos: string;
  metaGorduras: string;
  aguaMl: string;
  refeicoes: RefeicaoLocal[];
}

export function aplicarModeloNoEstadoFormulario(
  modelo: PlanoAlimentarAPI,
  gerarUid: () => string,
): EstadoFormularioPlano {
  return {
    titulo: modelo.titulo.replace(/\s*\(Modelo\)$/i, ""),
    objetivo: modelo.objetivo ?? "",
    observacoes: modelo.observacoes ?? "",
    metaCalorias: modelo.metaCalorias != null ? String(modelo.metaCalorias) : "",
    metaProteinas: modelo.metaProteinas != null ? String(modelo.metaProteinas) : "",
    metaCarboidratos: modelo.metaCarboidratos != null ? String(modelo.metaCarboidratos) : "",
    metaGorduras: modelo.metaGorduras != null ? String(modelo.metaGorduras) : "",
    aguaMl: modelo.recomendacaoAguaMl != null ? String(modelo.recomendacaoAguaMl) : "",
    refeicoes: (modelo.refeicoes || []).map((r, rIdx) => ({
      _uid: gerarUid(),
      nome: r.nome,
      horario: r.horario,
      ordem: r.ordem ?? rIdx,
      _activeOpcao: 0,
      opcoes: (r.opcoes || []).map((o, oIdx) => ({
        _uid: gerarUid(),
        nome: o.nome ?? null,
        ordem: o.ordem ?? oIdx,
        alimentos: (o.alimentos || []).map((a) => hidratarAlimentoSalvo(a, gerarUid())),
      })),
    })),
  };
}

export function precisaConfirmarSubstituicaoRefeicoes(
  refeicoes: ReadonlyArray<RefeicaoLocal>,
): boolean {
  return refeicoes.length > 0;
}

export function podeCriarNovaOpcao(totalOpcoes: number): boolean {
  return totalOpcoes < MAX_OPCOES_REFEICAO;
}

export function criarNovaOpcaoComSubstituicao(
  refeicoes: RefeicaoLocal[],
  ruid: string,
  ouid: string,
  alimentoOriginalUid: string,
  novoAlimento: AlimentoCalculavel,
  gerarUid: () => string,
): RefeicaoLocal[] {
  return refeicoes.map((r) => {
    if (r._uid !== ruid) return r;
    if (!podeCriarNovaOpcao(r.opcoes.length)) return r;

    const opcaoOrigem = r.opcoes.find((o) => o._uid === ouid);
    const alimentosClonados = opcaoOrigem
      ? opcaoOrigem.alimentos.map((a) =>
          a._uid === alimentoOriginalUid ? novoAlimento : { ...a, _uid: gerarUid() },
        )
      : [novoAlimento];

    const novaOpcao: OpcaoLocal = {
      _uid: gerarUid(),
      nome: `Subst. ${novoAlimento.alimento.split(",")[0]}`,
      ordem: r.opcoes.length,
      alimentos: alimentosClonados,
    };

    const novasOpcoes = [...r.opcoes, novaOpcao];
    return {
      ...r,
      opcoes: novasOpcoes,
      _activeOpcao: novasOpcoes.length - 1,
    };
  });
}

export function podeExcluirModeloClinica(
  modelo: Pick<PlanoAlimentarAPI, "usuarioId">,
  usuario?: Pick<TokenPayload, "userId" | "perfil" | "tipoClinica"> | null,
): boolean {
  if (!usuario) return true;
  if (usuario.tipoClinica === "AUTONOMO") return true;
  if (usuario.perfil === "ADMIN") return true;
  return modelo.usuarioId === usuario.userId;
}

export function extrairUpdatePlanoInput(
  data: CreatePlanoAlimentarInput,
): UpdatePlanoAlimentarInput {
  const { pacienteId: _pacienteId, isTemplate: _isTemplate, ...updateFields } = data;
  return updateFields;
}

export function formatarErroZodPlano(error: ZodError): string {
  const err = error.issues[0];
  if (!err) return "Verifique os campos do plano alimentar.";

  if (err.path[0] === "refeicoes") {
    const refIdx = Number(err.path[1]) + 1;
    if (err.path[2] === "nome") return `A refeição ${refIdx} precisa de um nome.`;
    if (err.path[2] === "horario") return `A refeição ${refIdx} precisa de um horário.`;
  }
  if (err.path[0] === "titulo") {
    return "O título do plano é obrigatório.";
  }
  return err.message;
}

interface HttpErrorShape {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export function extrairMensagemErroApi(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const candidate = err as HttpErrorShape;
    const apiMessage = candidate.response?.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
      return apiMessage;
    }
    if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
      return candidate.message;
    }
  }
  return fallback;
}
