import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Restaurant01Icon, Copy01Icon, Alert01Icon } from "@hugeicons/core-free-icons";
import {
  OBJETIVO_LABELS,
  listarPlanos,
  buscarPlano,
  criarPlano,
  atualizarPlano,
  deletarPlano,
  type PlanoAlimentarAPI,
} from "@/services/planoAlimentar";
import {
  createPlanoAlimentarSchema,
  updatePlanoAlimentarSchema,
  type CreatePlanoAlimentarInput,
} from "@nutricao/shared";
import {
  calcularTotaisPlano,
  duplicarPlanoParaInput,
  converterPlanoParaModeloInput,
} from "@/utils/nutricaoCalculos";
import { PlanoAlimentarView } from "./PlanoAlimentarView";
import { PlanoAlimentarBuilder } from "./PlanoAlimentarBuilder";
import { Skeleton } from "@/components/Loading/Skeleton";
import {
  extrairMensagemErroApi,
  extrairUpdatePlanoInput,
  formatarErroZodPlano,
} from "./planoAlimentarHelpers";
import styles from "./PlanoAlimentar.module.scss";

interface Props {
  pacienteId: string;
  isNutricionista?: boolean;
}

type Mode = "list" | "view" | "create" | "edit";

export function PlanoAlimentarTab({ pacienteId, isNutricionista = false }: Props) {
  const [mode, setMode] = useState<Mode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const templateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      if (templateTimerRef.current) {
        clearTimeout(templateTimerRef.current);
      }
    };
  }, []);

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
    mutationFn: async (data: CreatePlanoAlimentarInput) => {
      const validation = createPlanoAlimentarSchema.safeParse(data);
      if (!validation.success) {
        throw new Error(formatarErroZodPlano(validation.error));
      }
      return criarPlano(validation.data);
    },
    onMutate: () => setFeedbackError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-alimentares", pacienteId] });
      setMode("list");
    },
    onError: (err) => {
      setFeedbackError(extrairMensagemErroApi(err, "Não foi possível salvar o plano alimentar."));
    },
  });

  const duplicarMutation = useMutation({
    mutationFn: async (plano: PlanoAlimentarAPI) => {
      const payload = duplicarPlanoParaInput(plano);
      const validation = createPlanoAlimentarSchema.safeParse(payload);
      if (!validation.success) {
        throw new Error(formatarErroZodPlano(validation.error));
      }
      return criarPlano(validation.data);
    },
    onMutate: () => setFeedbackError(null),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["planos-alimentares", pacienteId] });
      const novoId = res?.data?.id;
      if (novoId) {
        setSelectedId(novoId);
        setMode("edit");
      } else {
        setMode("list");
      }
    },
    onError: (err) => {
      setFeedbackError(extrairMensagemErroApi(err, "Não foi possível duplicar o plano alimentar."));
    },
  });

  const salvarModeloMutation = useMutation({
    mutationFn: async (plano: PlanoAlimentarAPI) => {
      const payload = converterPlanoParaModeloInput(plano);
      const validation = createPlanoAlimentarSchema.safeParse(payload);
      if (!validation.success) {
        throw new Error(formatarErroZodPlano(validation.error));
      }
      return criarPlano(validation.data);
    },
    onMutate: () => setFeedbackError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-modelos"] });
      setTemplateSaved(true);
      if (templateTimerRef.current) {
        clearTimeout(templateTimerRef.current);
      }
      templateTimerRef.current = setTimeout(() => setTemplateSaved(false), 3000);
    },
    onError: (err) => {
      setFeedbackError(
        extrairMensagemErroApi(err, "Não foi possível salvar o plano como modelo da clínica."),
      );
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: async (data: CreatePlanoAlimentarInput) => {
      const updatePayload = extrairUpdatePlanoInput(data);
      const validation = updatePlanoAlimentarSchema.safeParse(updatePayload);
      if (!validation.success) {
        throw new Error(formatarErroZodPlano(validation.error));
      }
      return atualizarPlano(selectedId!, validation.data);
    },
    onMutate: () => setFeedbackError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-alimentares", pacienteId] });
      queryClient.invalidateQueries({ queryKey: ["plano-alimentar", selectedId] });
      setMode("view");
    },
    onError: (err) => {
      setFeedbackError(extrairMensagemErroApi(err, "Não foi possível atualizar o plano alimentar."));
    },
  });

  const deletarMutation = useMutation({
    mutationFn: () => deletarPlano(selectedId!),
    onMutate: () => setFeedbackError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-alimentares", pacienteId] });
      setSelectedId(null);
      setMode("list");
    },
    onError: (err) => {
      setFeedbackError(extrairMensagemErroApi(err, "Não foi possível excluir o plano alimentar."));
    },
  });

  function openView(id: string) {
    setFeedbackError(null);
    setSelectedId(id);
    setMode("view");
  }

  function getTotalCalorias(plano: PlanoAlimentarAPI) {
    return Math.round(calcularTotaisPlano(plano.refeicoes, "principal").cal);
  }

  const errorBanner = feedbackError ? (
    <div className={styles.errorBanner} role="alert">
      <HugeiconsIcon icon={Alert01Icon} size={18} strokeWidth={2} />
      <span>{feedbackError}</span>
    </div>
  ) : null;

  // === VIEW MODE ===
  if (mode === "view" && planoDetalhe) {
    return (
      <>
        {errorBanner}
        <PlanoAlimentarView
          plano={planoDetalhe}
          onBack={() => { setFeedbackError(null); setSelectedId(null); setMode("list"); }}
          onEdit={() => { setFeedbackError(null); setMode("edit"); }}
          onDuplicate={() => {
            if (!duplicarMutation.isPending) duplicarMutation.mutate(planoDetalhe);
          }}
          isDuplicating={duplicarMutation.isPending}
          onSaveAsTemplate={() => {
            if (!salvarModeloMutation.isPending) salvarModeloMutation.mutate(planoDetalhe);
          }}
          isSavingTemplate={salvarModeloMutation.isPending}
          templateSaved={templateSaved}
          onDelete={() => {
            if (!deletarMutation.isPending) deletarMutation.mutate();
          }}
          isDeleting={deletarMutation.isPending}
          isNutricionista={isNutricionista}
        />
      </>
    );
  }
  if (mode === "view" && loadingDetalhe) {
    return <div style={{ padding: "2rem" }}><Skeleton width="100%" height="200px" /></div>;
  }

  // === CREATE MODE (nutricionista only) ===
  if (mode === "create" && isNutricionista) {
    return (
      <>
        {errorBanner}
        <PlanoAlimentarBuilder
          pacienteId={pacienteId}
          onSave={(data) => {
            if (!criarMutation.isPending) criarMutation.mutate(data);
          }}
          onCancel={() => { setFeedbackError(null); setMode("list"); }}
          saving={criarMutation.isPending}
        />
      </>
    );
  }

  // === EDIT MODE (nutricionista only) ===
  if (mode === "edit" && isNutricionista && planoDetalhe) {
    return (
      <>
        {errorBanner}
        <PlanoAlimentarBuilder
          pacienteId={pacienteId}
          initialData={planoDetalhe}
          onSave={(data) => {
            if (!atualizarMutation.isPending) atualizarMutation.mutate(data);
          }}
          onCancel={() => { setFeedbackError(null); setMode("view"); }}
          saving={atualizarMutation.isPending}
        />
      </>
    );
  }
  if (mode === "edit" && loadingDetalhe) {
    return <div style={{ padding: "2rem" }}><Skeleton width="100%" height="200px" /></div>;
  }

  // === LIST MODE ===
  return (
    <div className={styles.tabContainer}>
      {errorBanner}
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.headerTitle}>Planos Alimentares</h2>
          <p className={styles.headerSubtitle}>Prescrições nutricionais do paciente</p>
        </div>
        {isNutricionista && (
          <button className={styles.newPlanBtn} onClick={() => { setFeedbackError(null); setMode("create"); }}>
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
                <span className={styles.planoCardTitle}>{p.titulo}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {isNutricionista && (
                    <button
                      type="button"
                      className={styles.pdfBtn}
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                      title="Duplicar este plano para ajustar no retorno"
                      disabled={duplicarMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicarMutation.mutate(p);
                      }}
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={13} strokeWidth={2} />
                      <span>Duplicar</span>
                    </button>
                  )}
                  <span className={styles.planoCardDate}>
                    {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
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
