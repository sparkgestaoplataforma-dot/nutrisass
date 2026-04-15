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
import { ExcluirAvaliacaoModal } from "./components/ExcluirAvaliacaoModal";
import { InfoAvaliacaoModal } from "./components/InfoAvaliacaoModal";

type FaixaScore = {
  pontuacaoMin: number;
  pontuacaoMax: number;
  classificacao: string;
};

const FAIXAS_SCORE: FaixaScore[] = [
  {
    pontuacaoMin: 0,
    pontuacaoMax: 30,
    classificacao:
      "Pessoa mais saudável, menores chances de hipersensibilidades",
  },
  {
    pontuacaoMin: 31,
    pontuacaoMax: 39,
    classificacao: "Indicativo de existência de hipersensibilidades",
  },
  {
    pontuacaoMin: 40,
    pontuacaoMax: 99,
    classificacao: "Absoluta certeza de existência de hipersensibilidade",
  },
  {
    pontuacaoMin: 100,
    pontuacaoMax: 9999,
    classificacao:
      "Saúde muito ruim - alta dificuldade para tarefas diárias, possível associação com doenças crônicas e degenerativas",
  },
];

const EXEMPLOS_CALCULO = [
  {
    descricao: "Exemplo 1 (baixo score)",
    formula: "0 + 1 + 2 + 1 + 0 + 1 + 0 + 1 + 2 + 1 = 9",
    score: 9,
  },
  {
    descricao: "Exemplo 2 (faixa intermediária)",
    formula: "3 + 4 + 3 + 2 + 4 + 3 + 4 + 3 + 4 + 4 = 34",
    score: 34,
  },
  {
    descricao: "Exemplo 3 (score elevado)",
    formula: "4 + 4 + 4 + 4 + 4 + 4 + 4 + 4 + 4 + 4 + 4 + 4 = 48",
    score: 48,
  },
  {
    descricao: "Exemplo 4 (score muito alto)",
    formula: "28 perguntas x nota 4 = 112",
    score: 112,
  },
];

function getDataAtualInput() {
  const hoje = new Date();
  const hojeLocal = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000);
  return hojeLocal.toISOString().slice(0, 10);
}

export function ComparativoPage() {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  const queryClient = useQueryClient();

  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>(() => getDataAtualInput());

  const [modalInfoPontuacaoAberto, setModalInfoPontuacaoAberto] =
    useState(false);
  const [excluirAvaliacaoModalAberto, setExcluirAvaliacaoModalAberto] =
    useState(false);
  const [avaliacaoIdParaExcluir, setAvaliacaoIdParaExcluir] =
    useState<string>("");
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
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const deleteAvaliacaoMutation = useMutation({
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
    onSuccess: () => {
      setExcluirAvaliacaoModalAberto(false);
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

  function handleAbrirModalInfoPontuacao() {
    setModalInfoPontuacaoAberto(true);
  }

  function handleFecharModalInfoPontuacao() {
    setModalInfoPontuacaoAberto(false);
  }

  function handleAbrirModalExcluirAvaliacao(id: string) {
    setExcluirAvaliacaoModalAberto(true);
    setAvaliacaoIdParaExcluir(id);
  }

  function handleFecharModalExcluirAvaliacao() {
    setExcluirAvaliacaoModalAberto(false);
  }

  function getClassificacaoPorScore(score: number) {
    const faixaEncontrada = FAIXAS_SCORE.find(
      (faixa) => score >= faixa.pontuacaoMin && score <= faixa.pontuacaoMax,
    );

    return faixaEncontrada?.classificacao || "Fora da faixa configurada";
  }

  const resultadosFiltrados = avaliacoes.filter((item) => {
    const dataAvaliacao = new Date(item.dataRealizacao);

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

    return rangeData;
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
          dataInicio={dataInicio}
          setDataInicio={setDataInicio}
          dataFim={dataFim}
          setDataFim={setDataFim}
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
            handleAbrirModalExcluirAvaliacao={handleAbrirModalExcluirAvaliacao}
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
              <h3>Como funciona o gráfico de evolução</h3>
              <button
                className={styles.closeBtn}
                onClick={handleFecharModalInfoPontuacao}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalSubtitulo}>
                Quanto menor o score total, melhor a evolução do paciente.
              </p>

              <div className={styles.scoreSection}>
                <h4>Como o score é calculado</h4>
                <p>
                  Cada resposta do questionário recebe uma nota. No fim, todas
                  as notas são somadas para gerar o score total.
                </p>
                <div className={styles.scoreFormula}>
                  Score total = nota 1 + nota 2 + nota 3 + ... + nota N
                </div>
                <p>
                  Depois da soma, a observação é definida pela faixa de
                  pontuação.
                </p>
              </div>

              <div className={styles.scoreSection}>
                <h4>Faixas de observação (conforme regra do score)</h4>
                <div className={styles.scoreTableWrapper}>
                  <table className={styles.scoreTable}>
                    <thead>
                      <tr>
                        <th>Pontuação mínima</th>
                        <th>Pontuação máxima</th>
                        <th>Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FAIXAS_SCORE.map((faixa) => (
                        <tr key={`${faixa.pontuacaoMin}-${faixa.pontuacaoMax}`}>
                          <td>{faixa.pontuacaoMin}</td>
                          <td>
                            {faixa.pontuacaoMax === 9999
                              ? ">100"
                              : faixa.pontuacaoMax}
                          </td>
                          <td>{faixa.classificacao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.scoreSection}>
                <h4>Exemplos de cálculo</h4>
                <div className={styles.scoreExamplesList}>
                  {EXEMPLOS_CALCULO.map((exemplo) => (
                    <div
                      key={exemplo.descricao}
                      className={styles.scoreExampleItem}
                    >
                      <strong>{exemplo.descricao}</strong>
                      <p>{exemplo.formula}</p>
                      <p>
                        <strong>Score:</strong> {exemplo.score} -{" "}
                        {getClassificacaoPorScore(exemplo.score)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {excluirAvaliacaoModalAberto && (
        <ExcluirAvaliacaoModal
          deleteAvaliacaoMutation={deleteAvaliacaoMutation}
          closeModal={handleFecharModalExcluirAvaliacao}
          avaliacaoIdParaExcluir={avaliacaoIdParaExcluir}
        />
      )}
    </div>
  );
}
