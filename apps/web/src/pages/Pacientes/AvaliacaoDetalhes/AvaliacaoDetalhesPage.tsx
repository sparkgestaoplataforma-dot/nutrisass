import { useState, useEffect } from "react";
import styles from "./AvaliacaoDetalhesPage.module.scss";
import { SidebarEsquerda } from "@/pages/Pacientes/AvaliacaoDetalhes/components/SidebarEsquerda";
import { SidebarDireita } from "@/pages/Pacientes/AvaliacaoDetalhes/components/SideBarDireita";
import { MainAvaliacaoDetalhes } from "./components/MainAvaliacaoDetalhes";
import { HeaderAvaliacaoDetalhes } from "./components/HeaderAvaliacaoDetalhes";
import { Avaliacao, getAvaliacaoComRespostas } from "@/services/avaliacao";
import { getPacientePorId } from "@/services/pacientes";
import { useParams } from "react-router-dom";

const InstrucoesItens = [
  { nota: 0, descricao: "Nunca ou quase nunca teve esse sintoma" },
  { nota: 1, descricao: "Ocasionalmente teve, mas não foi severo" },
  { nota: 2, descricao: "Ocasionalmente teve, efeito severo" },
  { nota: 3, descricao: "Frequentemente teve, efeito não severo" },
  { nota: 4, descricao: "Frequentemente teve, efeito foi severo" },
];

export function AvaliacaoDetalhesPage() {
  const { avaliacaoId, pacienteId } = useParams();
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [paciente, setPaciente] = useState<any>(null);
  useEffect(() => {
    const fetchPaciente = async () => {
      const pacienteData = await getPacientePorId(pacienteId!);
      setPaciente(pacienteData);
    };

    const fetchAvaliacaoComRespostas = async () => {
      const avaliacaoData = await getAvaliacaoComRespostas(avaliacaoId!);
      setAvaliacao(avaliacaoData.data || null);

      console.log("Avaliação com respostas obtida:", avaliacaoData);
      setAvaliacao(avaliacaoData.data || null);
    };
    fetchPaciente();
    fetchAvaliacaoComRespostas();
  }, [avaliacaoId]);
  const classificacao = avaliacao?.regrasInterpretacao?.find(
    (regra) =>
      avaliacao.scoreTotal >= regra.pontuacaoMin &&
      avaliacao.scoreTotal <= regra.pontuacaoMax,
  )?.classificacao;
  return (
    <div className={styles.page}>
      <HeaderAvaliacaoDetalhes paciente={paciente} />

      <div className={styles.layout}>
        <aside className={styles.sidebarLeft}>
          <SidebarEsquerda avaliacao={avaliacao} />
        </aside>

        <main>
          <MainAvaliacaoDetalhes
            InstrucoesItens={InstrucoesItens}
            avaliacao={avaliacao}
          />
        </main>

        <aside className={styles.sidebarRight}>
          <SidebarDireita avaliacao={avaliacao} classificacao={classificacao} />
        </aside>
      </div>
    </div>
  );
}
