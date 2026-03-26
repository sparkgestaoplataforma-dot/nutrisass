import { useState, useEffect } from "react";
import styles from "./AvaliacaoDetalhesPage.module.scss";
import { SidebarEsquerda } from "@/pages/Pacientes/AvaliacaoDetalhes/components/SidebarEsquerda";
import { SidebarDireita } from "@/pages/Pacientes/AvaliacaoDetalhes/components/SideBarDireita";
import { MainAvaliacaoDetalhes } from "./components/MainAvaliacaoDetalhes";
import { HeaderAvaliacaoDetalhes } from "./components/HeaderAvaliacaoDetalhes";
import {
  AvaliacaoComRespostas,
  getAvaliacaoComRespostas,
  DeleteAvaliacao,
} from "@/services/avaliacao";
import { getPacientePorId } from "@/services/pacientes";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export function AvaliacaoDetalhesPage() {
  const navigate = useNavigate();
  const { avaliacaoId, pacienteId } = useParams();
  const [avaliacao, setAvaliacao] = useState<AvaliacaoComRespostas | null>(
    null,
  );
  const [paciente, setPaciente] = useState<any>(null);
  useEffect(() => {
    const fetchPaciente = async () => {
      const pacienteData = await getPacientePorId(pacienteId!);
      setPaciente(pacienteData);
    };

    const fetchAvaliacaoComRespostas = async () => {
      const avaliacaoData = await getAvaliacaoComRespostas(avaliacaoId!);
      setAvaliacao(avaliacaoData.data || null);
      setAvaliacao(avaliacaoData.data || null);
    };
    fetchPaciente();
    fetchAvaliacaoComRespostas();
  }, [avaliacaoId]);

  const handleDeleteAvaliacao = () => {
    DeleteAvaliacao(avaliacaoId!);
    navigate(`/pacientes/${pacienteId}`);
  };
  return (
    <div className={styles.page}>
      <HeaderAvaliacaoDetalhes paciente={paciente} />

      <div className={styles.layout}>
        <aside className={styles.sidebarLeft}>
          <SidebarEsquerda avaliacao={avaliacao} />
        </aside>

        <main>
          <MainAvaliacaoDetalhes avaliacao={avaliacao} />
        </main>

        <aside className={styles.sidebarRight}>
          <SidebarDireita
            handleDeleteAvaliacao={handleDeleteAvaliacao}
            avaliacao={avaliacao}
          />
        </aside>
      </div>
    </div>
  );
}
