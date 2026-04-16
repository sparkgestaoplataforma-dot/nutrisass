import styles from "./AvaliacaoDetalhesPage.module.scss";
import { SidebarEsquerda } from "@/pages/Pacientes/AvaliacaoDetalhes/components/SidebarEsquerda";
import { SidebarDireita } from "@/pages/Pacientes/AvaliacaoDetalhes/components/SideBarDireita";
import { MainAvaliacaoDetalhes } from "./components/MainAvaliacaoDetalhes";
import { HeaderAvaliacaoDetalhes } from "./components/HeaderAvaliacaoDetalhes";
import {
  getAvaliacaoComRespostas,
  DeleteAvaliacao,
} from "@/services/avaliacao";
import { getPacientePorId, type Paciente } from "@/services/pacientes";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function AvaliacaoDetalhesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { avaliacaoId, pacienteId } = useParams();

  const {
    data: avaliacao,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["avaliacao", avaliacaoId],
    queryFn: async () => {
      const response = await getAvaliacaoComRespostas(avaliacaoId!);
      return response.data ?? null;
    },
    enabled: !!avaliacaoId,
  });
  const { data: paciente } = useQuery({
    queryKey: ["paciente", pacienteId],
    queryFn: async () => {
      const response = await getPacientePorId(pacienteId!);
      return response ?? null;
    },
    enabled: !!pacienteId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DeleteAvaliacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacao", avaliacaoId] });
      navigate(`/pacientes/${pacienteId}`);
    },
  });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p>Carregando Detalhes da avaliação...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.error}>
        <main>
          <h2>Erro ao carregar prontuário</h2>
          <p>{(error as Error).message}</p>
        </main>
      </div>
    );
  }
  return (
    <div className={styles.page}>
      <HeaderAvaliacaoDetalhes paciente={paciente} />

      <div className={styles.layout}>
        <aside className={styles.sidebarLeft}>
          <SidebarEsquerda avaliacao={avaliacao} />
        </aside>

        <main>
          <MainAvaliacaoDetalhes avaliacao={avaliacao ?? null} />
        </main>

        <aside className={styles.sidebarRight}>
          <SidebarDireita
            deleteMutation={deleteMutation}
            avaliacao={avaliacao}
            paciente={paciente}
          />
        </aside>
      </div>
    </div>
  );
}
