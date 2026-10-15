import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Restaurant01Icon,
  FileDownloadIcon,
} from "@hugeicons/core-free-icons";
import { listarPlanos, buscarPlano, criarPlano, atualizarPlano, deletarPlano, type PlanoAlimentarAPI } from "@/services/planoAlimentar";
import type { CreatePlanoAlimentarInput } from "@nutricao/shared";
import { PlanoAlimentarView } from "./PlanoAlimentarView";
import { PlanoAlimentarBuilder } from "./PlanoAlimentarBuilder";
import { Skeleton } from "@/components/Loading/Skeleton";
import styles from "./PlanoAlimentar.module.scss";

interface Props {
  pacienteId: string;
  isNutricionista?: boolean;
}

type Mode = "list" | "view" | "create" | "edit";

const OBJETIVO_LABELS: Record<string, string> = {
  EMAGRECIMENTO: "Emagrecimento",
  HIPERTROFIA: "Hipertrofia",
  MANUTENCAO: "Manutenção",
  REEDUCACAO_ALIMENTAR: "Reeducação Alimentar",
  OUTRO: "Outro",
};

export function PlanoAlimentarTab({ pacienteId, isNutricionista = false }: Props) {
  const [mode, setMode] = useState<Mode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ["planos-alimentares", pacienteId],
    queryFn: async () => {
      const res = await listarPlanos(pacienteId);
      return (res.data || []) as PlanoAlimentarAPI[];
    },
  });

  const { data: planoDetalhe, isLoading: loadingDetalhe } = useQuery({
    queryKey: ["plano-alimentar", selectedId],
    queryFn: async () => {
      const res = await buscarPlano(selectedId!);
      return res.data as PlanoAlimentarAPI;
    },
    enabled: !!selectedId && (mode === "view" || mode === "edit"),
  });

  const criarMutation = useMutation({
    mutationFn: (data: CreatePlanoAlimentarInput) => criarPlano(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-alimentares", pacienteId] });
      setMode("list");
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: (data: CreatePlanoAlimentarInput) => atualizarPlano(selectedId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-alimentares", pacienteId] });
      queryClient.invalidateQueries({ queryKey: ["plano-alimentar", selectedId] });
      setMode("view");
    },
  });

  const deletarMutation = useMutation({
    mutationFn: () => deletarPlano(selectedId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-alimentares", pacienteId] });
      setSelectedId(null);
      setMode("list");
    },
  });

  function openView(id: string) {
    setSelectedId(id);
    setMode("view");
  }

  function getTotalCalorias(plano: PlanoAlimentarAPI) {
    let cal = 0;
    for (const r of plano.refeicoes) {
      const opc = r.opcoes[0];
      if (!opc) continue;
      for (const a of opc.alimentos) cal += a.calorias || 0;
    }
    return Math.round(cal);
  }

  // === VIEW MODE ===
  if (mode === "view" && planoDetalhe) {
    return (
      <PlanoAlimentarView
        plano={planoDetalhe}
        onBack={() => { setSelectedId(null); setMode("list"); }}
        onEdit={() => setMode("edit")}
        onDelete={() => deletarMutation.mutate()}
        isDeleting={deletarMutation.isPending}
        isNutricionista={isNutricionista}
      />
    );
  }
  if (mode === "view" && loadingDetalhe) {
    return <div style={{ padding: "2rem" }}><Skeleton width="100%" height="200px" /></div>;
  }

  // === CREATE MODE (nutricionista only) ===
  if (mode === "create" && isNutricionista) {
    return (
      <PlanoAlimentarBuilder
        pacienteId={pacienteId}
        onSave={(data) => criarMutation.mutate(data)}
        onCancel={() => setMode("list")}
        saving={criarMutation.isPending}
      />
    );
  }

  // === EDIT MODE (nutricionista only) ===
  if (mode === "edit" && isNutricionista && planoDetalhe) {
    return (
      <PlanoAlimentarBuilder
        pacienteId={pacienteId}
        initialData={planoDetalhe}
        onSave={(data) => atualizarMutation.mutate(data)}
        onCancel={() => setMode("view")}
        saving={atualizarMutation.isPending}
      />
    );
  }
  if (mode === "edit" && loadingDetalhe) {
    return <div style={{ padding: "2rem" }}><Skeleton width="100%" height="200px" /></div>;
  }

  // === LIST MODE ===
  return (
    <div className={styles.tabContainer}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.headerTitle}>Planos Alimentares</h2>
          <p className={styles.headerSubtitle}>Prescrições nutricionais do paciente</p>
        </div>
        {isNutricionista && (
          <button className={styles.newPlanBtn} onClick={() => setMode("create")}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
            Novo Plano
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Skeleton width="100%" height="100px" borderRadius="12px" />
          <Skeleton width="100%" height="100px" borderRadius="12px" />
        </div>
      ) : planos.length === 0 ? (
        <div className={styles.emptyState}>
          <HugeiconsIcon icon={Restaurant01Icon} size={48} strokeWidth={1.2} />
          <p className={styles.emptyTitle}>Nenhum plano alimentar</p>
          <p className={styles.emptyText}>Crie o primeiro plano alimentar para este paciente.</p>
        </div>
      ) : (
        <div className={styles.planosList}>
          {planos.map((p) => (
            <div key={p.id} className={styles.planoCard} onClick={() => openView(p.id)}>
              <div className={styles.planoCardHeader}>
                <div className={styles.planoCardTitleRow}>
                  <span className={styles.planoCardTitle}>{p.titulo}</span>
                  <span className={styles.planoCardDate}>
                    {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.downloadPdfBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `/pacientes/${p.pacienteId || pacienteId}/planos/${p.id}/pdf`,
                      "_blank"
                    );
                  }}
                  title="Baixar PDF do Plano Alimentar"
                  aria-label={`Baixar PDF do plano ${p.titulo}`}
                >
                  <HugeiconsIcon icon={FileDownloadIcon} size={15} strokeWidth={2} />
                  <span>Baixar PDF</span>
                </button>
              </div>
              <div className={styles.planoCardBadges}>
                {p.objetivo && (
                  <span className={styles.objetivoBadge}>
                    {OBJETIVO_LABELS[p.objetivo] || p.objetivo}
                  </span>
                )}
              </div>
              <div className={styles.planoCardMacros}>
                <div className={styles.macroItem}>
                  <span className={styles.macroValue}>{getTotalCalorias(p)} kcal</span>
                  <span className={styles.macroLabel}>Calorias</span>
                </div>
                <div className={styles.macroItem}>
                  <span className={styles.macroValue}>{p.refeicoes.length}</span>
                  <span className={styles.macroLabel}>Refeições</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
