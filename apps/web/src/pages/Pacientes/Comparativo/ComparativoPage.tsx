import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ComparativoPage.module.scss";
import { HeaderComparativo } from "./components/HeaderComparativo";
import { getPacientePorId } from "@/services/pacientes";
import {
  getAvaliacoesPorPacienteId,
  DeleteAvaliacao,
} from "@/services/avaliacao";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  criarQuestionarioDefault,
  listarQuestionarios,
} from "@/services/questionarios";
import { useAuthStore } from "@/stores/authStore";
import { GraficoComparativo } from "./components/GraficoComparativo";
import { FilterComparativo } from "./components/FilterComparativo";
import { TabelaComparativo } from "./components/TabelaComparativo";
import { ModalResponderExameComparativo } from "./components/ModalResponderExameComparativo";
import { ModalRangeDataComparativo } from "./components/ModalRangeDataComparativo";

type PacienteSelecionado = {
  id: string;
  nome: string;
};

export function ComparativoPage() {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  const [modalQuestionariosAberto, setModalQuestionariosAberto] =
    useState(false);
  const [modalRangeDataAberto, setModalRangeDataAberto] = useState(false);

  const [pacienteSelecionado, setPacienteSelecionado] =
    useState<PacienteSelecionado | null>(null);
  const [questionarioCopiadoId, setQuestionarioCopiadoId] = useState<
    string | null
  >(null);

  const { data: pacienteResponse } = useQuery({
    queryKey: ["paciente", pacienteId],
    queryFn: () => getPacientePorId(pacienteId!),
    enabled: !!pacienteId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  const { data: avaliacoesResponse } = useQuery({
    queryKey: ["avaliacoes", pacienteId],
    queryFn: () => getAvaliacoesPorPacienteId(pacienteId!),
    enabled: !!pacienteId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const cadastrarDefaultMutation = useMutation({
    mutationFn: criarQuestionarioDefault,
    onSuccess: async () => {
      await refetchQuestionarios();
    },
  });

  const {
    data: questionarios = [],
    isLoading: isLoadingQuestionarios,
    refetch: refetchQuestionarios,
  } = useQuery({
    queryKey: ["questionarios-modal"],
    queryFn: listarQuestionarios,
    enabled: modalQuestionariosAberto,
  });

  const avaliacoes = avaliacoesResponse?.data || [];
  const paciente = pacienteResponse;
  const perfil = (user?.perfil || "").toUpperCase();
  const podeCadastrarDefault = perfil === "ADMIN" || perfil === "NUTRICIONISTA";
  const isSecretaria = perfil === "SECRETARIA";

  function formatarData(dataISO: string) {
    const data = new Date(dataISO);

    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function parseDateInput(value: string) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function handleAbrirQuestionarios(paciente: PacienteSelecionado) {
    setPacienteSelecionado(paciente);
    setModalQuestionariosAberto(true);
  }

  function handleFecharModalQuestionarios() {
    setModalQuestionariosAberto(false);
    setPacienteSelecionado(null);
    setQuestionarioCopiadoId(null);
  }
  function handleAbrirRangeData() {
    setModalRangeDataAberto(true);
  }

  function handleLimparFiltro() {
    setDataInicio("");
    setDataFim("");
    setModalRangeDataAberto(false);
  }

  function handleFecharModal() {
    setModalRangeDataAberto(false);
  }

  async function handleCopiarUrl(questionarioId: string) {
    if (!pacienteSelecionado) return;

    const url = `${window.location.origin}/questionarios/${questionarioId}/pacientes/${pacienteSelecionado.id}/responder`;

    try {
      await navigator.clipboard.writeText(url);
      setQuestionarioCopiadoId(questionarioId);
      setTimeout(() => {
        setQuestionarioCopiadoId((current) =>
          current === questionarioId ? null : current,
        );
      }, 1600);
    } catch {
      alert("Não foi possível copiar a URL.");
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DeleteAvaliacao(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["avaliacoes", pacienteId] });
      const previousData = queryClient.getQueriesData<any>({
        queryKey: ["avaliacoes", pacienteId],
      });

      queryClient.setQueryData(["avaliacoes", pacienteId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((avaliacao: any) => avaliacao.id != id),
        };
      });
      return { previousData };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(
        ["avaliacoes", pacienteId],
        context?.previousData,
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes", pacienteId] });
    },
  });

  const resultadosFiltrados = avaliacoes.filter((item) => {
    const dataAvaliacao = new Date(item.dataRealizacao);

    const pesquisa = formatarData(item.dataRealizacao)
      .toLowerCase()
      .includes(busca.toLowerCase());

    let rangeData = true;

    if (dataInicio) {
      const inicio = parseDateInput(dataInicio);
      rangeData = rangeData && dataAvaliacao >= inicio;
    }

    if (dataFim) {
      const fim = parseDateInput(dataFim);
      fim.setHours(23, 59, 59, 999);
      rangeData = rangeData && dataAvaliacao <= fim;
    }

    return pesquisa && rangeData;
  });

  const graficoDados = resultadosFiltrados
    .slice()
    .sort(
      (a, b) =>
        new Date(a.dataRealizacao).getTime() -
        new Date(b.dataRealizacao).getTime(),
    )
    .map((item) => ({
      data: formatarData(item.dataRealizacao),
      score: item.scoreTotal,
    }));

  return (
    <div>
      <HeaderComparativo paciente={paciente} />
      <div className={styles.chartContainer}>
        <GraficoComparativo graficoDados={graficoDados} />
      </div>

      <div className={styles.header}>
        <FilterComparativo
          paciente={paciente!}
          busca={busca}
          setBusca={setBusca}
          handleAbrirQuestionarios={handleAbrirQuestionarios}
          handleAbrirRangeData={handleAbrirRangeData}
        />
      </div>

      <div className={styles.container}>
        {resultadosFiltrados.length === 0 ? (
          <div className={styles.empty}>Nenhum resultado encontrado.</div>
        ) : (
          <TabelaComparativo
            pacienteId={pacienteId!}
            resultadosFiltrados={resultadosFiltrados}
            formatarData={formatarData}
            navigate={navigate}
            deleteMutation={deleteMutation}
          />
        )}
      </div>
      {modalQuestionariosAberto && pacienteSelecionado && (
        <ModalResponderExameComparativo
          handleFecharModalQuestionarios={handleFecharModalQuestionarios}
          pacienteSelecionado={pacienteSelecionado}
          questionarios={questionarios}
          podeCadastrarDefault={podeCadastrarDefault}
          cadastrarDefaultMutation={cadastrarDefaultMutation}
          questionarioCopiadoId={questionarioCopiadoId}
          handleCopiarUrl={handleCopiarUrl}
          isSecretaria={isSecretaria}
          isLoadingQuestionarios={isLoadingQuestionarios}
        />
      )}

      {modalRangeDataAberto && (
        <ModalRangeDataComparativo
          handleFecharModal={handleFecharModal}
          dataInicio={dataInicio}
          setDataInicio={setDataInicio}
          dataFim={dataFim}
          setDataFim={setDataFim}
          handleLimparFiltro={handleLimparFiltro}
        />
      )}
    </div>
  );
}
