import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { listarMedidas } from "@/services/prontuario";
import { getPacientePorId } from "@/services/pacientes";
import { AlimentoSearch } from "./AlimentoSearch";
import type { AlimentoAPI, PlanoAlimentarAPI } from "@/services/planoAlimentar";
import {
  type CreatePlanoAlimentarInput,
  createPlanoAlimentarSchema,
} from "@nutricao/shared";
import {
  type AlimentoCalculavel,
  type ProtocoloTMB,
  FATORES_ATIVIDADE,
  hidratarAlimentoSalvo,
  criarAlimentoInicial,
  recalcularAlimentoPlano,
  formatarLabelMedidaCaseira,
  calcularTotaisAlimentos,
  calcularTotaisPlano,
  calcularTMB,
  calcularGET,
  calcularDistribuicaoMacrosPorGKg,
  calcularMetricasMacro,
  calcularRecomendacaoAgua,
  gerarRefeicoesPadrao,
} from "@/utils/nutricaoCalculos";
import styles from "./PlanoAlimentar.module.scss";

interface OpcaoLocal {
  _uid: string;
  nome: string | null;
  ordem: number;
  alimentos: AlimentoCalculavel[];
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

function calcularIdadeAnos(dataNascimento?: string | null): number {
  if (!dataNascimento) return 30;
  const birth = new Date(dataNascimento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(1, age);
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

  // --- Dados do Paciente e Última Medida para a Calculadora TMB/GET/g-kg ---
  const { data: paciente } = useQuery({
    queryKey: ["paciente", pacienteId],
    queryFn: () => getPacientePorId(pacienteId),
    enabled: !!pacienteId,
  });

  const { data: medidas = [] } = useQuery({
    queryKey: ["medidas", pacienteId],
    queryFn: () => listarMedidas(pacienteId),
    enabled: !!pacienteId,
  });

  const ultimaMedida = medidas[0] || null;

  // Estados da Calculadora de Gasto Energético (TMB/GET) e Macros (g/kg)
  const [calcAberta, setCalcAberta] = useState<boolean>(!initialData);
  const [calcPeso, setCalcPeso] = useState<number>(70);
  const [calcAltura, setCalcAltura] = useState<number>(170);
  const [calcIdade, setCalcIdade] = useState<number>(30);
  const [calcSexo, setCalcSexo] = useState<"MASCULINO" | "FEMININO">("FEMININO");
  const [calcMassaMagra, setCalcMassaMagra] = useState<string>("");
  const [calcProtocolo, setCalcProtocolo] = useState<ProtocoloTMB>("MIFFLIN_ST_JEOR");
  const [calcKcalPorKg, setCalcKcalPorKg] = useState<number>(25);
  const [calcFatorAtiv, setCalcFatorAtiv] = useState<number>(1.375);
  const [calcAjusteKcal, setCalcAjusteKcal] = useState<number>(0);
  const [calcProtGKg, setCalcProtGKg] = useState<number>(1.8);
  const [calcGordGKg, setCalcGordGKg] = useState<number>(0.9);
  const [calcMlAguaKg, setCalcMlAguaKg] = useState<number>(35);

  // Sincroniza dados antropométricos do paciente quando carregados
  useEffect(() => {
    if (ultimaMedida?.peso) setCalcPeso(ultimaMedida.peso);
    if (ultimaMedida?.altura) setCalcAltura(ultimaMedida.altura);
    if (ultimaMedida?.massaMagraKg) {
      setCalcMassaMagra(String(ultimaMedida.massaMagraKg));
    }
  }, [ultimaMedida]);

  useEffect(() => {
    if (paciente?.dataNascimento) {
      setCalcIdade(calcularIdadeAnos(paciente.dataNascimento));
    }
    if (paciente?.sexo === "MASCULINO" || paciente?.sexo === "FEMININO") {
      setCalcSexo(paciente.sexo);
    }
  }, [paciente]);

  // Cálculo em tempo real na calculadora
  const resultadoCalc = useMemo(() => {
    const tmb = calcularTMB({
      peso: calcPeso,
      alturaCm: calcAltura,
      idade: calcIdade,
      sexo: calcSexo,
      protocolo: calcProtocolo,
      massaMagraKg: calcMassaMagra ? parseFloat(calcMassaMagra) : null,
      kcalPorKg: calcKcalPorKg,
    });
    const { get, metaCalorias: metaSugerida } =
      calcProtocolo === "BOLSO"
        ? { get: Math.round(tmb), metaCalorias: Math.max(0, Math.round(tmb + calcAjusteKcal)) }
        : calcularGET(tmb, calcFatorAtiv, calcAjusteKcal);

    const macros = calcularDistribuicaoMacrosPorGKg({
      pesoKg: calcPeso,
      metaCalorias: metaSugerida,
      proteinaGKg: calcProtGKg,
      gorduraGKg: calcGordGKg,
    });

    const aguaSugerida = calcularRecomendacaoAgua(calcPeso, calcMlAguaKg);

    return {
      tmb: Math.round(tmb),
      get,
      metaSugerida,
      macros,
      aguaSugerida,
    };
  }, [
    calcPeso,
    calcAltura,
    calcIdade,
    calcSexo,
    calcProtocolo,
    calcMassaMagra,
    calcKcalPorKg,
    calcFatorAtiv,
    calcAjusteKcal,
    calcProtGKg,
    calcGordGKg,
    calcMlAguaKg,
  ]);

  function aplicarCalculoNasMetas() {
    setMetaCalorias(resultadoCalc.metaSugerida.toString());
    setMetaProteinas(resultadoCalc.macros.proteinasG.toString());
    setMetaCarboidratos(resultadoCalc.macros.carboidratosG.toString());
    setMetaGorduras(resultadoCalc.macros.gordurasG.toString());
    setAguaMl(resultadoCalc.aguaSugerida.toString());
  }

  // Inicializa refeições usando hidratarAlimentoSalvo (corrige Bug #1A de edição!)
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
        alimentos: o.alimentos.map((a) => hidratarAlimentoSalvo(a, uid())),
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

  const preencherRefeicoesPadrao = useCallback(() => {
    const padrao = gerarRefeicoesPadrao();
    setRefeicoes((prev) => [
      ...prev,
      ...padrao.map((p, idx) => ({
        _uid: uid(),
        nome: p.nome,
        horario: p.horario,
        ordem: prev.length + idx,
        _activeOpcao: 0,
        opcoes: [{ _uid: uid(), nome: null, ordem: 0, alimentos: [] }],
      })),
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
    (ruid: string, ouid: string, apiAlimento: AlimentoAPI) => {
      const newAl = criarAlimentoInicial(apiAlimento, uid());
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

  // Usa recalcularAlimentoPlano testado via TDD (corrige Bugs #1B e #1C)
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
                alimentos: o.alimentos.map((a) =>
                  a._uid === auid ? recalcularAlimentoPlano(a, field, value) : a,
                ),
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

  // Totals (unificados com calcularTotaisPlano)
  const totaisDiarios = useMemo(
    () => calcularTotaisPlano(refeicoes, "principal"),
    [refeicoes],
  );

  // Métricas g/kg e % em tempo real para as metas preenchidas
  const metaCalNum = parseFloat(metaCalorias) || 0;
  const infoMetaProt = calcularMetricasMacro(
    parseFloat(metaProteinas) || 0,
    "proteina",
    calcPeso,
    metaCalNum,
  );
  const infoMetaCarb = calcularMetricasMacro(
    parseFloat(metaCarboidratos) || 0,
    "carboidrato",
    calcPeso,
    metaCalNum,
  );
  const infoMetaGord = calcularMetricasMacro(
    parseFloat(metaGorduras) || 0,
    "gordura",
    calcPeso,
    metaCalNum,
  );

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
              onChange={(e) => {
                const novoObj = e.target.value;
                setObjetivo(novoObj);
                if (novoObj === "EMAGRECIMENTO") setCalcAjusteKcal(-400);
                else if (novoObj === "HIPERTROFIA") setCalcAjusteKcal(350);
                else if (novoObj === "MANUTENCAO" || novoObj === "REEDUCACAO_ALIMENTAR") setCalcAjusteKcal(0);
              }}
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
            <label className={styles.fieldLabel}>Observações e Orientações Gerais</label>
            <textarea
              className={styles.fieldTextarea}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações gerais do plano, orientações de preparo, chás, suplementos..."
            />
          </div>
        </div>

        {/* Seção de Metas + Calculadora de Gasto Energético (TMB/GET) e Macros (g/kg) */}
        <div className={styles.metasBuilderSection}>
          <div className={styles.calcToggleRow}>
            <p className={styles.metasBuilderTitle} style={{ marginBottom: 0 }}>
              Metas Nutricionais Diárias
            </p>
            <button
              type="button"
              className={styles.calcToggleBtn}
              onClick={() => setCalcAberta((v) => !v)}
            >
              {calcAberta
                ? "Ocultar Calculadora de Gasto Energético (TMB/GET)"
                : "⚡ Calcular Gasto Energético (TMB/GET) e Macros (g/kg)"}
            </button>
          </div>

          {calcAberta && (
            <div className={styles.calcPanel}>
              <div className={styles.calcPanelHeader}>
                <span className={styles.calcPanelTitle}>
                  Calculadora de Gasto Energético (TMB / GET) e Distribuição por g/kg
                </span>
                <span className={styles.calcPanelBadge}>
                  {ultimaMedida?.peso
                    ? `Dados puxados da última avaliação (${new Date(ultimaMedida.data).toLocaleDateString("pt-BR")})`
                    : "Preencha o peso e altura do paciente"}
                </span>
              </div>

              {/* Linha 1: Dados antropométricos e protocolo */}
              <div className={styles.calcGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Peso (kg)</label>
                  <input
                    className={styles.fieldInput}
                    type="number"
                    step="0.1"
                    value={calcPeso}
                    onChange={(e) => setCalcPeso(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Altura (cm)</label>
                  <input
                    className={styles.fieldInput}
                    type="number"
                    step="0.5"
                    value={calcAltura}
                    onChange={(e) => setCalcAltura(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Idade (anos)</label>
                  <input
                    className={styles.fieldInput}
                    type="number"
                    value={calcIdade}
                    onChange={(e) => setCalcIdade(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Sexo</label>
                  <select
                    className={styles.fieldSelect}
                    value={calcSexo}
                    onChange={(e) => setCalcSexo(e.target.value as "MASCULINO" | "FEMININO")}
                  >
                    <option value="FEMININO">Feminino</option>
                    <option value="MASCULINO">Masculino</option>
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Fórmula (Protocolo)</label>
                  <select
                    className={styles.fieldSelect}
                    value={calcProtocolo}
                    onChange={(e) => setCalcProtocolo(e.target.value as ProtocoloTMB)}
                  >
                    <option value="MIFFLIN_ST_JEOR">Mifflin-St Jeor (Recomendada)</option>
                    <option value="HARRIS_BENEDICT">Harris-Benedict (1919)</option>
                    <option value="FAO_OMS">FAO / OMS</option>
                    <option value="CUNNINGHAM">Cunningham (Esportiva / Massa Magra)</option>
                    <option value="TINSLEY_PESO">Tinsley (2018 - Hipertrofia)</option>
                    <option value="BOLSO">Fórmula de Bolso (kcal/kg)</option>
                  </select>
                </div>
              </div>

              {/* Linha 2: Fator atividade, Ajuste calórico e g/kg de Macros */}
              <div className={styles.calcGrid}>
                {calcProtocolo === "CUNNINGHAM" && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      Massa Magra (kg)
                      {ultimaMedida?.massaMagraKg && (
                        <small style={{ marginLeft: "6px", fontWeight: 500, color: "#059669" }}>
                          (Últ. medida: {ultimaMedida.massaMagraKg} kg)
                        </small>
                      )}
                    </label>
                    <input
                      className={styles.fieldInput}
                      type="number"
                      step="0.1"
                      placeholder="Auto (~78%)"
                      value={calcMassaMagra}
                      onChange={(e) => setCalcMassaMagra(e.target.value)}
                    />
                  </div>
                )}

                {calcProtocolo === "BOLSO" ? (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Meta kcal/kg de peso</label>
                    <input
                      className={styles.fieldInput}
                      type="number"
                      step="1"
                      value={calcKcalPorKg}
                      onChange={(e) => setCalcKcalPorKg(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                ) : (
                  <div className={styles.fieldGroup} style={{ gridColumn: "span 2" }}>
                    <label className={styles.fieldLabel}>Nível de Atividade Física (NAF)</label>
                    <select
                      className={styles.fieldSelect}
                      value={calcFatorAtiv}
                      onChange={(e) => setCalcFatorAtiv(parseFloat(e.target.value))}
                    >
                      {FATORES_ATIVIDADE.map((fa) => (
                        <option key={fa.valor} value={fa.valor}>
                          {fa.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Ajuste Objetivo (kcal)</label>
                  <input
                    className={styles.fieldInput}
                    type="number"
                    step="50"
                    value={calcAjusteKcal}
                    onChange={(e) => setCalcAjusteKcal(parseInt(e.target.value) || 0)}
                    title="Ex: -500 para emagrecimento, +300 para hipertrofia"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Proteína (g/kg)</label>
                  <input
                    className={styles.fieldInput}
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="4.0"
                    value={calcProtGKg}
                    onChange={(e) => setCalcProtGKg(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Gordura (g/kg)</label>
                  <input
                    className={styles.fieldInput}
                    type="number"
                    step="0.1"
                    min="0.3"
                    max="2.5"
                    value={calcGordGKg}
                    onChange={(e) => setCalcGordGKg(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Barra de Resultados Calculados + Botão Aplicar */}
              <div className={styles.calcResultBar}>
                <div className={styles.calcResultMetrics}>
                  <div className={styles.calcMetricBox}>
                    <span>TMB (Basal)</span>
                    <strong>{resultadoCalc.tmb} kcal</strong>
                  </div>
                  <div className={styles.calcMetricBox}>
                    <span>GET (Manutenção)</span>
                    <strong>{resultadoCalc.get} kcal</strong>
                  </div>
                  <div className={styles.calcMetricBox}>
                    <span>VET Planejado</span>
                    <strong style={{ color: "#059669" }}>
                      {resultadoCalc.metaSugerida} kcal
                    </strong>
                  </div>
                  <div className={styles.calcMetricBox}>
                    <span>Proteínas ({calcProtGKg}g/kg)</span>
                    <strong>
                      {resultadoCalc.macros.proteinasG}g ({resultadoCalc.macros.proteinaPct}%)
                    </strong>
                  </div>
                  <div className={styles.calcMetricBox}>
                    <span>Carboidratos ({resultadoCalc.macros.carboidratoGKg}g/kg)</span>
                    <strong>
                      {resultadoCalc.macros.carboidratosG}g ({resultadoCalc.macros.carboidratoPct}%)
                    </strong>
                  </div>
                  <div className={styles.calcMetricBox}>
                    <span>Gorduras ({calcGordGKg}g/kg)</span>
                    <strong>
                      {resultadoCalc.macros.gordurasG}g ({resultadoCalc.macros.gorduraPct}%)
                    </strong>
                  </div>
                  <div className={styles.calcMetricBox}>
                    <span>Água ({calcMlAguaKg}ml/kg)</span>
                    <strong>{resultadoCalc.aguaSugerida} ml</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={aplicarCalculoNasMetas}
                >
                  <HugeiconsIcon icon={Tick01Icon} size={15} strokeWidth={2.2} />
                  Aplicar às Metas do Plano
                </button>
              </div>
            </div>
          )}

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
              {calcPeso > 0 && metaCalNum > 0 && (
                <span className={styles.metaSubHint}>
                  {(metaCalNum / calcPeso).toFixed(1)} kcal/kg
                </span>
              )}
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
              {infoMetaProt.gPorKg != null && (
                <span className={styles.metaSubHint}>
                  {infoMetaProt.gPorKg} g/kg
                  {infoMetaProt.percentual != null ? ` • ${infoMetaProt.percentual}%` : ""}
                </span>
              )}
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
              {infoMetaCarb.gPorKg != null && (
                <span className={styles.metaSubHint}>
                  {infoMetaCarb.gPorKg} g/kg
                  {infoMetaCarb.percentual != null ? ` • ${infoMetaCarb.percentual}%` : ""}
                </span>
              )}
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
              {infoMetaGord.gPorKg != null && (
                <span className={styles.metaSubHint}>
                  {infoMetaGord.gPorKg} g/kg
                  {infoMetaGord.percentual != null ? ` • ${infoMetaGord.percentual}%` : ""}
                </span>
              )}
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
              {calcPeso > 0 && parseInt(aguaMl) > 0 && (
                <span className={styles.metaSubHint}>
                  {Math.round(parseInt(aguaMl) / calcPeso)} ml/kg
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      {hasMetas && (
        <div className={styles.builderMetasProgress}>
          <p className={styles.builderMetasProgressTitle}>Progresso Atual (Opção Principal)</p>
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
                ? calcularTotaisAlimentos(opcaoAtiva.alimentos)
                : { cal: 0, prot: 0, carb: 0, gord: 0, fibra: 0 };

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
                            title={ref.opcoes.length >= 10 ? "O limite máximo é de 10 opções" : "Adicionar nova opção de substituição"}
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
                                    Qtd
                                  </span>
                                  <span className={styles.alimentoRowHeaderCell}>
                                    Medida
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
                                  <span className={styles.alimentoRowHeaderCell}>
                                    Fibra
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
                                  <input
                                    className={styles.alimentoMiniInput}
                                    type="number"
                                    min={0}
                                    step="any"
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
                                    <option value="">g (gramas)</option>
                                    {al._medidasCaseiras.map((mc) => (
                                      <option key={mc.id} value={mc.id}>
                                        {formatarLabelMedidaCaseira(mc)}
                                      </option>
                                    ))}
                                  </select>
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
                                  <span className={styles.macroCell}>
                                    {al.fibra != null ? al.fibra.toFixed(1) : "0"}
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
                                <div className={styles.refeicaoTotalItem}>
                                  <span className={styles.refeicaoTotalLabel}>
                                    Fibras:
                                  </span>
                                  <span className={styles.refeicaoTotalValue}>
                                    {opcTotais.fibra.toFixed(1)}g
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

        <div className={styles.refeicoesQuickBar}>
          <button className={styles.addRefeicaoBtn} onClick={addRefeicao} style={{ flex: 2 }}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
            Adicionar Refeição
          </button>
          {refeicoes.length === 0 && (
            <button
              type="button"
              className={styles.addRefeicaoBtn}
              onClick={preencherRefeicoesPadrao}
              style={{ flex: 1, borderColor: "#10b981", color: "#047857" }}
            >
              ⚡ Criar 5 Refeições Padrão (Café ao Jantar)
            </button>
          )}
        </div>
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
            { label: "Fibras", value: `${totaisDiarios.fibra.toFixed(1)}g` },
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
