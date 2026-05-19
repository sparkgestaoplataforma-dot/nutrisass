import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Delete02Icon,
  DragDropIcon,
  ArrowLeft01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";
import { AlimentoSearch } from "./AlimentoSearch";
import type { AlimentoAPI, PlanoAlimentarAPI } from "@/services/planoAlimentar";
import {
  type CreatePlanoAlimentarInput,
  createPlanoAlimentarSchema,
} from "@nutricao/shared";
import styles from "./PlanoAlimentar.module.scss";

// === Types ===
interface AlimentoLocal {
  _uid: string;
  alimentoId: string | null;
  medidaCaseiraId: string | null;
  alimento: string;
  quantidade: number;
  unidade: string;
  calorias: number | null;
  proteinas: number | null;
  carboidratos: number | null;
  gorduras: number | null;
  observacao: string | null;
  _basePer100: { cal: number; prot: number; carb: number; gord: number };
  _medidasCaseiras: { id: string; nome: string; quantidadeEmGramas: number }[];
}

interface OpcaoLocal {
  _uid: string;
  nome: string | null;
  ordem: number;
  alimentos: AlimentoLocal[];
}

interface RefeicaoLocal {
  _uid: string;
  nome: string;
  horario: string;
  ordem: number;
  opcoes: OpcaoLocal[];
  _activeOpcao: number;
}

interface Props {
  pacienteId: string;
  initialData?: PlanoAlimentarAPI | null;
  onSave: (data: CreatePlanoAlimentarInput) => void;
  onCancel: () => void;
  saving?: boolean;
}

let uidCounter = 0;
function uid() {
  return `_${++uidCounter}_${Date.now()}`;
}

function calcMacros(base: AlimentoLocal["_basePer100"], qtdGramas: number) {
  const f = qtdGramas / 100;
  return {
    calorias: Math.round(base.cal * f * 10) / 10,
    proteinas: Math.round(base.prot * f * 10) / 10,
    carboidratos: Math.round(base.carb * f * 10) / 10,
    gorduras: Math.round(base.gord * f * 10) / 10,
  };
}

// === Sortable Meal Wrapper ===
function SortableRefeicao({
  id,
  render,
}: {
  id: string;
  render: (listeners: any) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {render(listeners)}
    </div>
  );
}

// === Main Component ===
export function PlanoAlimentarBuilder({
  pacienteId,
  initialData,
  onSave,
  onCancel,
  saving,
}: Props) {
  const [titulo, setTitulo] = useState(initialData?.titulo || "");
  const [objetivo, setObjetivo] = useState(initialData?.objetivo || "");
  const [observacoes, setObservacoes] = useState(
    initialData?.observacoes || "",
  );
  const [metaCalorias, setMetaCalorias] = useState<string>(
    initialData?.metaCalorias?.toString() || "",
  );
  const [metaProteinas, setMetaProteinas] = useState<string>(
    initialData?.metaProteinas?.toString() || "",
  );
  const [metaCarboidratos, setMetaCarboidratos] = useState<string>(
    initialData?.metaCarboidratos?.toString() || "",
  );
  const [metaGorduras, setMetaGorduras] = useState<string>(
    initialData?.metaGorduras?.toString() || "",
  );
  const [aguaMl, setAguaMl] = useState<string>(
    initialData?.recomendacaoAguaMl?.toString() || "",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingOpcao, setEditingOpcao] = useState<{ ruid: string; ouid: string } | null>(null);

  const [refeicoes, setRefeicoes] = useState<RefeicaoLocal[]>(() => {
    if (!initialData?.refeicoes?.length) return [];
    return initialData.refeicoes.map((r) => ({
      _uid: uid(),
      nome: r.nome,
      horario: r.horario,
      ordem: r.ordem,
      _activeOpcao: 0,
      opcoes: r.opcoes.map((o) => ({
        _uid: uid(),
        nome: o.nome,
        ordem: o.ordem,
        alimentos: o.alimentos.map((a) => ({
          _uid: uid(),
          alimentoId: a.alimentoId,
          medidaCaseiraId: a.medidaCaseiraId,
          alimento: a.alimento,
          quantidade: a.quantidade,
          unidade: a.unidade,
          calorias: a.calorias,
          proteinas: a.proteinas,
          carboidratos: a.carboidratos,
          gorduras: a.gorduras,
          observacao: a.observacao,
          _basePer100: { cal: 0, prot: 0, carb: 0, gord: 0 },
          // Usa as medidas caseiras que já vêm da API via alimentoRel
          _medidasCaseiras: a.alimentoRel?.medidasCaseiras ?? [],
        })),
      })),
    }));
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Handlers
  const addRefeicao = useCallback(() => {
    setRefeicoes((prev) => [
      ...prev,
      {
        _uid: uid(),
        nome: "",
        horario: "08:00",
        ordem: prev.length,
        _activeOpcao: 0,
        opcoes: [{ _uid: uid(), nome: null, ordem: 0, alimentos: [] }],
      },
    ]);
  }, []);

  const removeRefeicao = useCallback((ruid: string) => {
    setRefeicoes((prev) =>
      prev.filter((r) => r._uid !== ruid).map((r, i) => ({ ...r, ordem: i })),
    );
  }, []);

  const updateRefeicao = useCallback(
    (ruid: string, field: string, value: any) => {
      setRefeicoes((prev) =>
        prev.map((r) => (r._uid === ruid ? { ...r, [field]: value } : r)),
      );
    },
    [],
  );

  const addOpcao = useCallback((ruid: string) => {
    setRefeicoes((prev) =>
      prev.map((r) => {
        if (r._uid !== ruid) return r;
        const newOpcoes = [
          ...r.opcoes,
          { _uid: uid(), nome: null, ordem: r.opcoes.length, alimentos: [] },
        ];
        return { ...r, opcoes: newOpcoes, _activeOpcao: newOpcoes.length - 1 };
      }),
    );
  }, []);

  const updateOpcaoNome = useCallback(
    (ruid: string, ouid: string, nome: string) => {
      setRefeicoes((prev) =>
        prev.map((r) => {
          if (r._uid !== ruid) return r;
          const newOpcoes = r.opcoes.map((o) =>
            o._uid === ouid ? { ...o, nome: nome.trim() || null } : o
          );
          return { ...r, opcoes: newOpcoes };
        })
      );
    },
    []
  );

  const removeOpcao = useCallback((ruid: string, ouid: string) => {
    setRefeicoes((prev) =>
      prev.map((r) => {
        if (r._uid !== ruid) return r;
        if (r.opcoes.length <= 1) return r;
        const newOpcoes = r.opcoes
          .filter((o) => o._uid !== ouid)
          .map((o, i) => ({ ...o, ordem: i }));
        return {
          ...r,
          opcoes: newOpcoes,
          _activeOpcao: Math.min(r._activeOpcao, newOpcoes.length - 1),
        };
      }),
    );
  }, []);

  const addAlimento = useCallback(
    (ruid: string, ouid: string, api: AlimentoAPI) => {
      const defaultMeasure = api.medidasCaseiras?.find(
        (m) => m.nome.toLowerCase() === "ml"
      );
      const newAl: AlimentoLocal = {
        _uid: uid(),
        alimentoId: api.id,
        medidaCaseiraId: defaultMeasure ? defaultMeasure.id : null,
        alimento: api.nome,
        quantidade: 100,
        unidade: defaultMeasure ? defaultMeasure.nome : "g",
        calorias: api.calorias,
        proteinas: api.proteinas,
        carboidratos: api.carboidratos,
        gorduras: api.gorduras,
        observacao: null,
        _basePer100: {
          cal: api.calorias || 0,
          prot: api.proteinas || 0,
          carb: api.carboidratos || 0,
          gord: api.gorduras || 0,
        },
        _medidasCaseiras: api.medidasCaseiras || [],
      };
      setRefeicoes((prev) =>
        prev.map((r) => {
          if (r._uid !== ruid) return r;
          return {
            ...r,
            opcoes: r.opcoes.map((o) =>
              o._uid === ouid
                ? { ...o, alimentos: [...o.alimentos, newAl] }
                : o,
            ),
          };
        }),
      );
    },
    [],
  );

  const removeAlimento = useCallback(
    (ruid: string, ouid: string, auid: string) => {
      setRefeicoes((prev) =>
        prev.map((r) => {
          if (r._uid !== ruid) return r;
          return {
            ...r,
            opcoes: r.opcoes.map((o) =>
              o._uid === ouid
                ? {
                    ...o,
                    alimentos: o.alimentos.filter((a) => a._uid !== auid),
                  }
                : o,
            ),
          };
        }),
      );
    },
    [],
  );

  const updateAlimento = useCallback(
    (ruid: string, ouid: string, auid: string, field: string, value: any) => {
      setRefeicoes((prev) =>
        prev.map((r) => {
          if (r._uid !== ruid) return r;
          return {
            ...r,
            opcoes: r.opcoes.map((o) => {
              if (o._uid !== ouid) return o;
              return {
                ...o,
                alimentos: o.alimentos.map((a) => {
                  if (a._uid !== auid) return a;
                  const updated = { ...a, [field]: value };
                  if (field === "quantidade" || field === "medidaCaseiraId") {
                    let qtdG = updated.quantidade;
                    if (field === "medidaCaseiraId" && value) {
                      const mc = a._medidasCaseiras.find((m) => m.id === value);
                      if (mc) {
                        qtdG = mc.quantidadeEmGramas * updated.quantidade;
                        updated.unidade = mc.nome;
                      }
                    } else if (
                      field === "quantidade" &&
                      !updated.medidaCaseiraId
                    ) {
                      qtdG = value;
                    }
                    if (a._basePer100.cal > 0 || a._basePer100.prot > 0) {
                      const m = calcMacros(a._basePer100, qtdG);
                      updated.calorias = m.calorias;
                      updated.proteinas = m.proteinas;
                      updated.carboidratos = m.carboidratos;
                      updated.gorduras = m.gorduras;
                    }
                  }
                  return updated;
                }),
              };
            }),
          };
        }),
      );
    },
    [],
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setRefeicoes((prev) => {
      const oldIdx = prev.findIndex((r) => r._uid === active.id);
      const newIdx = prev.findIndex((r) => r._uid === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx).map((r, i) => ({
        ...r,
        ordem: i,
      }));
    });
  }, []);

  // Totals
  const totaisDiarios = useMemo(() => {
    let cal = 0,
      prot = 0,
      carb = 0,
      gord = 0;
    for (const r of refeicoes) {
      const opc = r.opcoes[0];
      if (!opc) continue;
      for (const a of opc.alimentos) {
        cal += a.calorias || 0;
        prot += a.proteinas || 0;
        carb += a.carboidratos || 0;
        gord += a.gorduras || 0;
      }
    }
    return { cal, prot, carb, gord };
  }, [refeicoes]);

  function getOpcaoTotais(als: AlimentoLocal[]) {
    let cal = 0,
      prot = 0,
      carb = 0,
      gord = 0;
    for (const a of als) {
      cal += a.calorias || 0;
      prot += a.proteinas || 0;
      carb += a.carboidratos || 0;
      gord += a.gorduras || 0;
    }
    return { cal, prot, carb, gord };
  }

  function metaPct(cur: number, meta: string) {
    const m = parseFloat(meta);
    if (!m || m <= 0) return 0;
    return Math.min((cur / m) * 100, 100);
  }

  // Submit
  function handleSubmit() {
    setErrorMsg(null);
    const payload: CreatePlanoAlimentarInput = {
      pacienteId,
      titulo,
      objetivo: (objetivo as any) || null,
      metaCalorias: metaCalorias ? parseFloat(metaCalorias) : null,
      metaProteinas: metaProteinas ? parseFloat(metaProteinas) : null,
      metaCarboidratos: metaCarboidratos ? parseFloat(metaCarboidratos) : null,
      metaGorduras: metaGorduras ? parseFloat(metaGorduras) : null,
      recomendacaoAguaMl: aguaMl ? parseInt(aguaMl) : null,
      observacoes: observacoes || null,
      refeicoes: refeicoes.map((r) => ({
        nome: r.nome,
        horario: r.horario,
        ordem: r.ordem,
        opcoes: r.opcoes.map((o) => ({
          nome: o.nome,
          ordem: o.ordem,
          alimentos: o.alimentos.map((a) => ({
            alimentoId: a.alimentoId,
            medidaCaseiraId: a.medidaCaseiraId,
            alimento: a.alimento,
            quantidade: a.quantidade,
            unidade: a.unidade,
            calorias: a.calorias,
            proteinas: a.proteinas,
            carboidratos: a.carboidratos,
            gorduras: a.gorduras,
            observacao: a.observacao,
          })),
        })),
      })),
    };

    const validation = createPlanoAlimentarSchema.safeParse(payload);
    if (!validation.success) {
      const err = validation.error.issues[0];
      let msg = err.message;

      if (err.path[0] === "refeicoes") {
        const refIdx = Number(err.path[1]) + 1;
        if (err.path[2] === "nome")
          msg = `A refeição ${refIdx} precisa de um nome.`;
        if (err.path[2] === "horario")
          msg = `A refeição ${refIdx} precisa de um horário.`;
      } else if (err.path[0] === "titulo") {
        msg = "O título do plano é obrigatório.";
      }

      setErrorMsg(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    onSave(validation.data as CreatePlanoAlimentarInput);
  }

  const hasMetas =
    metaCalorias || metaProteinas || metaCarboidratos || metaGorduras;

  return (
    <div className={styles.builderContainer}>
      <button className={styles.backBtn} onClick={onCancel}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2} />
        <span>Voltar</span>
      </button>

      {errorMsg && (
        <div className={styles.errorBanner}>
          <HugeiconsIcon icon={Alert01Icon} size={18} strokeWidth={2} />
          {errorMsg}
        </div>
      )}

      {/* Header Fields */}
      <div className={styles.builderHeader}>
        <div className={styles.builderRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Título do Plano *</label>
            <input
              className={styles.fieldInput}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Dieta para Emagrecimento"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Objetivo</label>
            <select
              className={styles.fieldSelect}
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="EMAGRECIMENTO">Emagrecimento</option>
              <option value="HIPERTROFIA">Hipertrofia</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="REEDUCACAO_ALIMENTAR">Reeducação Alimentar</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
        </div>
        <div className={styles.builderRowFull}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Observações</label>
            <textarea
              className={styles.fieldTextarea}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações gerais do plano..."
            />
          </div>
        </div>
        <div className={styles.metasBuilderSection}>
          <p className={styles.metasBuilderTitle}>Metas Nutricionais Diárias</p>
          <div className={styles.metasBuilderGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Calorias (kcal)</label>
              <input
                className={styles.metaInput}
                type="number"
                value={metaCalorias}
                onChange={(e) => setMetaCalorias(e.target.value)}
                placeholder="2000"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Proteínas (g)</label>
              <input
                className={styles.metaInput}
                type="number"
                value={metaProteinas}
                onChange={(e) => setMetaProteinas(e.target.value)}
                placeholder="150"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Carboidratos (g)</label>
              <input
                className={styles.metaInput}
                type="number"
                value={metaCarboidratos}
                onChange={(e) => setMetaCarboidratos(e.target.value)}
                placeholder="250"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Gorduras (g)</label>
              <input
                className={styles.metaInput}
                type="number"
                value={metaGorduras}
                onChange={(e) => setMetaGorduras(e.target.value)}
                placeholder="65"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Água (ml)</label>
              <input
                className={styles.metaInput}
                type="number"
                value={aguaMl}
                onChange={(e) => setAguaMl(e.target.value)}
                placeholder="2500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      {hasMetas && (
        <div className={styles.builderMetasProgress}>
          <p className={styles.builderMetasProgressTitle}>Progresso Atual</p>
          <div className={styles.builderMetasProgressGrid}>
            {[
              {
                label: "Calorias",
                cur: totaisDiarios.cal,
                meta: metaCalorias,
                unit: "kcal",
              },
              {
                label: "Proteínas",
                cur: totaisDiarios.prot,
                meta: metaProteinas,
                unit: "g",
              },
              {
                label: "Carboidratos",
                cur: totaisDiarios.carb,
                meta: metaCarboidratos,
                unit: "g",
              },
              {
                label: "Gorduras",
                cur: totaisDiarios.gord,
                meta: metaGorduras,
                unit: "g",
              },
            ].map((m) => (
              <div key={m.label} className={styles.metaItem}>
                <div className={styles.metaLabelRow}>
                  <span className={styles.metaLabel}>{m.label}</span>
                  <span className={styles.metaNumbers}>
                    {m.cur.toFixed(0)} / {m.meta || "—"} {m.unit}
                  </span>
                </div>
                <div className={styles.metaProgressBar}>
                  <div
                    className={`${styles.metaProgressFill} ${metaPct(m.cur, m.meta) >= 100 ? styles.over : ""}`}
                    style={{ width: `${metaPct(m.cur, m.meta)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refeições DnD */}
      <div className={styles.refeicoesSection}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={refeicoes.map((r) => r._uid)}
            strategy={verticalListSortingStrategy}
          >
            {refeicoes.map((ref) => {
              const activeOpcIdx = ref._activeOpcao;
              const opcaoAtiva = ref.opcoes[activeOpcIdx];
              const opcTotais = opcaoAtiva
                ? getOpcaoTotais(opcaoAtiva.alimentos)
                : { cal: 0, prot: 0, carb: 0, gord: 0 };

              return (
                <SortableRefeicao
                  key={ref._uid}
                  id={ref._uid}
                  render={(listeners: any) => (
                    <div className={styles.refeicaoCard}>
                      <div className={styles.refeicaoHeader}>
                        <div className={styles.dragHandle} {...listeners}>
                          <HugeiconsIcon
                            icon={DragDropIcon}
                            size={16}
                            strokeWidth={2}
                          />
                        </div>
                        <input
                          className={styles.refeicaoNameInput}
                          value={ref.nome}
                          onChange={(e) =>
                            updateRefeicao(ref._uid, "nome", e.target.value)
                          }
                          placeholder="Nome da refeição (ex: Café da Manhã)"
                        />
                        <input
                          className={styles.refeicaoTimeInput}
                          type="time"
                          value={ref.horario}
                          onChange={(e) =>
                            updateRefeicao(ref._uid, "horario", e.target.value)
                          }
                        />
                        <button
                          className={styles.removeRefeicaoBtn}
                          onClick={() => removeRefeicao(ref._uid)}
                          title="Remover refeição"
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            size={14}
                            strokeWidth={2}
                          />
                        </button>
                      </div>

                      <div className={styles.refeicaoBody}>
                        {/* Opções Tabs */}
                        <div className={styles.opcoesTabsBuilder}>
                          {ref.opcoes.map((opc, idx) => (
                            <span
                              key={opc._uid}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              <button
                                className={`${styles.opcaoTabBuilder} ${idx === activeOpcIdx ? styles.active : ""}`}
                                onClick={() => {
                                  if (idx === activeOpcIdx) {
                                    setEditingOpcao({ ruid: ref._uid, ouid: opc._uid });
                                  } else {
                                    updateRefeicao(ref._uid, "_activeOpcao", idx);
                                  }
                                }}
                              >
                                {editingOpcao?.ruid === ref._uid && editingOpcao?.ouid === opc._uid ? (
                                  <input
                                    autoFocus
                                    defaultValue={opc.nome || `Opção ${idx + 1}`}
                                    onBlur={(e) => {
                                      updateOpcaoNome(ref._uid, opc._uid, e.target.value);
                                      setEditingOpcao(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        updateOpcaoNome(ref._uid, opc._uid, e.currentTarget.value);
                                        setEditingOpcao(null);
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingOpcao(null);
                                      }
                                    }}
                                    style={{ width: '80px', background: 'transparent', border: 'none', outline: 'none', borderBottom: '1px solid currentColor', color: 'inherit', font: 'inherit', padding: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  opc.nome || `Opção ${idx + 1}`
                                )}
                              </button>
                              {ref.opcoes.length > 1 && (
                                <button
                                  className={styles.removeOpcaoBtn}
                                  onClick={() =>
                                    removeOpcao(ref._uid, opc._uid)
                                  }
                                  title="Remover opção"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                          <button
                            className={styles.addOpcaoBtn}
                            onClick={() => addOpcao(ref._uid)}
                            disabled={ref.opcoes.length >= 10}
                            title={ref.opcoes.length >= 10 ? "O limite máximo é de 10 opções" : "Adicionar nova opção"}
                          >
                            + Opção
                          </button>
                        </div>

                        {/* Alimento Search */}
                        {opcaoAtiva && (
                          <>
                            <AlimentoSearch
                              onSelect={(al) =>
                                addAlimento(ref._uid, opcaoAtiva._uid, al)
                              }
                            />

                            {/* Alimentos Container for Horizontal Scroll on Mobile */}
                            <div className={styles.alimentosGridContainer}>
                              {/* Alimentos Header */}
                              {opcaoAtiva.alimentos.length > 0 && (
                                <div className={styles.alimentoRowHeader}>
                                  <span className={styles.alimentoRowHeaderCell}>
                                    Alimento
                                  </span>
                                  <span className={styles.alimentoRowHeaderCell}>
                                    Medida
                                  </span>
                                  <span className={styles.alimentoRowHeaderCell}>
                                    Qtd
                                  </span>
                                  <span className={styles.alimentoRowHeaderCell}>
                                    Kcal
                                  </span>
                                  <span className={styles.alimentoRowHeaderCell}>
                                    Prot
                                  </span>
                                  <span className={styles.alimentoRowHeaderCell}>
                                    Carb
                                  </span>
                                  <span className={styles.alimentoRowHeaderCell}>
                                    Gord
                                  </span>
                                  <span />
                                </div>
                              )}

                              {/* Alimentos Rows */}
                              {opcaoAtiva.alimentos.map((al) => (
                                <div key={al._uid} className={styles.alimentoRow}>
                                  <span
                                    className={styles.alimentoName}
                                    title={al.alimento}
                                  >
                                    {al.alimento}
                                  </span>
                                  <select
                                    className={styles.alimentoMiniSelect}
                                    value={al.medidaCaseiraId || ""}
                                    onChange={(e) =>
                                      updateAlimento(
                                        ref._uid,
                                        opcaoAtiva._uid,
                                        al._uid,
                                        "medidaCaseiraId",
                                        e.target.value || null,
                                      )
                                    }
                                  >
                                    <option value="">g</option>
                                    {al._medidasCaseiras.map((mc) => (
                                      <option key={mc.id} value={mc.id}>
                                        {mc.nome}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    className={styles.alimentoMiniInput}
                                    type="number"
                                    min={0}
                                    value={al.quantidade.toString()}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(
                                        /^0+(?=\d)/,
                                        "",
                                      );
                                      updateAlimento(
                                        ref._uid,
                                        opcaoAtiva._uid,
                                        al._uid,
                                        "quantidade",
                                        val === "" ? 0 : parseFloat(val),
                                      );
                                    }}
                                  />
                                  <span className={styles.macroCell}>
                                    {al.calorias?.toFixed(0) || "0"}
                                  </span>
                                  <span className={styles.macroCell}>
                                    {al.proteinas?.toFixed(1) || "0"}
                                  </span>
                                  <span className={styles.macroCell}>
                                    {al.carboidratos?.toFixed(1) || "0"}
                                  </span>
                                  <span className={styles.macroCell}>
                                    {al.gorduras?.toFixed(1) || "0"}
                                  </span>
                                  <button
                                    className={styles.removeAlimentoBtn}
                                    onClick={() =>
                                      removeAlimento(
                                        ref._uid,
                                        opcaoAtiva._uid,
                                        al._uid,
                                      )
                                    }
                                  >
                                    <HugeiconsIcon
                                      icon={Delete02Icon}
                                      size={12}
                                      strokeWidth={2}
                                    />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Totais da opção */}
                            {opcaoAtiva.alimentos.length > 0 && (
                              <div className={styles.refeicaoTotais}>
                                <div className={styles.refeicaoTotalItem}>
                                  <span className={styles.refeicaoTotalLabel}>
                                    Kcal:
                                  </span>
                                  <span className={styles.refeicaoTotalValue}>
                                    {opcTotais.cal.toFixed(0)}
                                  </span>
                                </div>
                                <div className={styles.refeicaoTotalItem}>
                                  <span className={styles.refeicaoTotalLabel}>
                                    P:
                                  </span>
                                  <span className={styles.refeicaoTotalValue}>
                                    {opcTotais.prot.toFixed(1)}g
                                  </span>
                                </div>
                                <div className={styles.refeicaoTotalItem}>
                                  <span className={styles.refeicaoTotalLabel}>
                                    C:
                                  </span>
                                  <span className={styles.refeicaoTotalValue}>
                                    {opcTotais.carb.toFixed(1)}g
                                  </span>
                                </div>
                                <div className={styles.refeicaoTotalItem}>
                                  <span className={styles.refeicaoTotalLabel}>
                                    G:
                                  </span>
                                  <span className={styles.refeicaoTotalValue}>
                                    {opcTotais.gord.toFixed(1)}g
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                />
              );
            })}
          </SortableContext>
        </DndContext>

        <button className={styles.addRefeicaoBtn} onClick={addRefeicao}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
          Adicionar Refeição
        </button>
      </div>

      {/* Footer */}
      <div className={styles.builderFooter}>
        <div className={styles.builderFooterTotals}>
          {[
            {
              label: "Calorias",
              value: `${totaisDiarios.cal.toFixed(0)} kcal`,
            },
            { label: "Proteínas", value: `${totaisDiarios.prot.toFixed(1)}g` },
            {
              label: "Carboidratos",
              value: `${totaisDiarios.carb.toFixed(1)}g`,
            },
            { label: "Gorduras", value: `${totaisDiarios.gord.toFixed(1)}g` },
          ].map((t) => (
            <div key={t.label} className={styles.footerTotalItem}>
              <div className={styles.footerTotalValue}>{t.value}</div>
              <div className={styles.footerTotalLabel}>{t.label}</div>
            </div>
          ))}
        </div>
        <div className={styles.builderFooterActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancelar
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSubmit}
            disabled={!titulo || refeicoes.length === 0 || saving}
          >
            {saving
              ? "Salvando..."
              : initialData
                ? "Atualizar Plano"
                : "Salvar Plano"}
          </button>
        </div>
      </div>
    </div>
  );
}
