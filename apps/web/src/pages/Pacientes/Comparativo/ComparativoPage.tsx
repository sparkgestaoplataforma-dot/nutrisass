import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ComparativoPage.module.scss";
import { HeaderComparativo } from "./components/HeaderComparativo";
import { buscarNomePacientePublico } from "@/services/pacientes";
import {
  getAvaliacoesPorPacienteId,
  DeleteAvaliacao,
} from "@/services/avaliacao";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraficoComparativo } from "./components/GraficoComparativo";
import { FilterComparativo } from "./components/FilterComparativo";
import { TabelaComparativo } from "./components/TabelaComparativo";
import { ModalRangeDataComparativo } from "./components/ModalRangeDataComparativo";

export function ComparativoPage() {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  const queryClient = useQueryClient();

  const [filtroData, setFiltroData] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  const [modalRangeDataAberto, setModalRangeDataAberto] = useState(false);
  const [modalInfoPontuacaoAberto, setModalInfoPontuacaoAberto] =
    useState(false);

  const { data: nomePaciente } = useQuery({
    queryKey: ["paciente-nome-publico", pacienteId],
    queryFn: () => buscarNomePacientePublico(pacienteId!),
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

  const avaliacoes = avaliacoesResponse?.data || [];

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

  function isSameDay(firstDate: Date, secondDate: Date) {
    return (
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    );
  }

  function handleAbrirRangeData() {
    setModalRangeDataAberto(true);
  }

  function handleAbrirModalInfoPontuacao() {
    setModalInfoPontuacaoAberto(true);
  }

  function handleFecharModalInfoPontuacao() {
    setModalInfoPontuacaoAberto(false);
  }

  function handleLimparFiltro() {
    setFiltroData("");
    setDataInicio("");
    setDataFim("");
    setModalRangeDataAberto(false);
  }

  function handleFecharModal() {
    setModalRangeDataAberto(false);
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DeleteAvaliacao(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["avaliacoes", pacienteId] });
      const previousData = queryClient.getQueryData<any>([
        "avaliacoes",
        pacienteId,
      ]);

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
    const pesquisa = filtroData
      ? isSameDay(dataAvaliacao, parseDateInput(filtroData))
      : true;

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
      <HeaderComparativo nomePaciente={nomePaciente} />
      <div className={styles.chartContainer}>
        <div className={styles.chartGraphic}>
          <GraficoComparativo
            graficoDados={graficoDados}
            onInfoClick={handleAbrirModalInfoPontuacao}
          />
        </div>
      </div>

      <div className={styles.header}>
        <FilterComparativo
          filtroData={filtroData}
          setFiltroData={setFiltroData}
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

      {modalInfoPontuacaoAberto && (
        <div
          className={styles.overlay}
          onClick={handleFecharModalInfoPontuacao}
        >
          <div
            className={styles.infoModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Como funciona a evolução</h3>
              <button
                className={styles.closeBtn}
                onClick={handleFecharModalInfoPontuacao}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalSubtitulo}>
                Quanto menor a nota, melhor.
              </p>

              <div className={styles.modalInfoText}>
                <p>Quanto mais se somam as notas, pior a saúde do paciente.</p>
                <p>
                  Então quanto menor a pontuação total, melhor a evolução dele.
                </p>
              </div>
            </div>
          </div>
        </div>
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
