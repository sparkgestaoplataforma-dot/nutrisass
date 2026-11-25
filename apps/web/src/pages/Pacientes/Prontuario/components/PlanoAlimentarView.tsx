import { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  PencilEdit01Icon,
  Delete02Icon,
  FileDownloadIcon,
  WavingHand02Icon,
  Copy01Icon,
} from "@hugeicons/core-free-icons";
import type { PlanoAlimentarAPI } from "@/services/planoAlimentar";
import { calcularTotaisAlimentos, calcularTotaisPlano } from "@/utils/nutricaoCalculos";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal/DeleteConfirmModal";
import styles from "./PlanoAlimentar.module.scss";

interface Props {
  plano: PlanoAlimentarAPI;
  onBack: () => void;
  onEdit: () => void;
  onDuplicate?: () => void;
  isDuplicating?: boolean;
  onSaveAsTemplate?: () => void;
  isSavingTemplate?: boolean;
  templateSaved?: boolean;
  onDelete: () => void;
  isDeleting?: boolean;
  isNutricionista?: boolean;
}

const OBJETIVO_LABELS: Record<string, string> = {
  EMAGRECIMENTO: "Emagrecimento",
  HIPERTROFIA: "Hipertrofia",
  MANUTENCAO: "Manutenção",
  REEDUCACAO_ALIMENTAR: "Reeducação Alimentar",
  OUTRO: "Outro",
};

export function PlanoAlimentarView({
  plano,
  onBack,
  onEdit,
  onDuplicate,
  isDuplicating,
  onSaveAsTemplate,
  isSavingTemplate,
  templateSaved,
  onDelete,
  isDeleting,
  isNutricionista = false,
}: Props) {
  // Track active option tab per refeição
  const [activeOpcoes, setActiveOpcoes] = useState<Record<string, number>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Calcula totais do dia inteiro de forma unificada (Opção Principal)
  const totaisDiarios = useMemo(
    () => calcularTotaisPlano(plano.refeicoes, "principal"),
    [plano],
  );

  function metaPercent(current: number, meta: number | null) {
    if (!meta || meta <= 0) return 0;
    return Math.min((current / meta) * 100, 150);
  }

  const hasMetas = plano.metaCalorias || plano.metaProteinas || plano.metaCarboidratos || plano.metaGorduras;

  return (
    <div className={styles.viewContainer}>
      {/* Back */}
      <button className={styles.backBtn} onClick={onBack}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2} />
        <span>Voltar</span>
      </button>

      {/* Header */}
      <div className={styles.viewHeader}>
        <div>
          <h2 className={styles.viewTitle}>{plano.titulo}</h2>
          {plano.objetivo && (
            <span className={styles.objetivoBadge}>
              {OBJETIVO_LABELS[plano.objetivo] || plano.objetivo}
            </span>
          )}
        </div>
        <div className={styles.viewActions}>
          {isNutricionista && (
            <button className={styles.editBtn} onClick={onEdit}>
              <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={2} />
              <span>Editar</span>
            </button>
          )}
          {isNutricionista && onDuplicate && (
            <button
              className={styles.pdfBtn}
              onClick={onDuplicate}
              disabled={isDuplicating}
              title="Criar uma cópia deste plano para ajustar no retorno"
            >
              <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={2} />
              <span>{isDuplicating ? "Duplicando..." : "Duplicar"}</span>
            </button>
          )}
          {isNutricionista && onSaveAsTemplate && (
            <button
              className={styles.pdfBtn}
              onClick={onSaveAsTemplate}
              disabled={isSavingTemplate}
              title="Salvar este cardápio na biblioteca de modelos da clínica"
            >
              <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={2} />
              <span>
                {templateSaved
                  ? "Modelo Salvo!"
                  : isSavingTemplate
                    ? "Salvando Modelo..."
                    : "Salvar como Modelo"}
              </span>
            </button>
          )}
          {isNutricionista && (
            <button
              className={styles.deleteBtn}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
              <span>Excluir</span>
            </button>
          )}
          <button
            className={styles.pdfBtn}
            onClick={() => window.open(`/pacientes/${plano.pacienteId}/planos/${plano.id}/pdf`, '_blank')}
            title="Baixar PDF do Plano Alimentar"
          >
            <HugeiconsIcon icon={FileDownloadIcon} size={14} strokeWidth={2} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Metas Progress */}
      {hasMetas && (
        <div className={styles.metasBar}>
          <p className={styles.metasTitle}>Progresso das Metas</p>
          <div className={styles.metasGrid}>
            {plano.metaCalorias != null && plano.metaCalorias > 0 && (
              <div className={styles.metaItem}>
                <div className={styles.metaLabelRow}>
                  <span className={styles.metaLabel}>Calorias</span>
                  <span className={styles.metaNumbers}>
                    {Math.round(totaisDiarios.cal)} / {plano.metaCalorias} kcal
                  </span>
                </div>
                <div className={styles.metaProgressBar}>
                  <div
                    className={`${styles.metaProgressFill} ${metaPercent(totaisDiarios.cal, plano.metaCalorias) > 100 ? styles.over : ""}`}
                    style={{ width: `${Math.min(metaPercent(totaisDiarios.cal, plano.metaCalorias), 100)}%` }}
                  />
                </div>
              </div>
            )}
            {plano.metaProteinas != null && plano.metaProteinas > 0 && (
              <div className={styles.metaItem}>
                <div className={styles.metaLabelRow}>
                  <span className={styles.metaLabel}>Proteínas</span>
                  <span className={styles.metaNumbers}>
                    {totaisDiarios.prot.toFixed(1)} / {plano.metaProteinas}g
                  </span>
                </div>
                <div className={styles.metaProgressBar}>
                  <div
                    className={`${styles.metaProgressFill} ${metaPercent(totaisDiarios.prot, plano.metaProteinas) > 100 ? styles.over : ""}`}
                    style={{ width: `${Math.min(metaPercent(totaisDiarios.prot, plano.metaProteinas), 100)}%` }}
                  />
                </div>
              </div>
            )}
            {plano.metaCarboidratos != null && plano.metaCarboidratos > 0 && (
              <div className={styles.metaItem}>
                <div className={styles.metaLabelRow}>
                  <span className={styles.metaLabel}>Carboidratos</span>
                  <span className={styles.metaNumbers}>
                    {totaisDiarios.carb.toFixed(1)} / {plano.metaCarboidratos}g
                  </span>
                </div>
                <div className={styles.metaProgressBar}>
                  <div
                    className={`${styles.metaProgressFill} ${metaPercent(totaisDiarios.carb, plano.metaCarboidratos) > 100 ? styles.over : ""}`}
                    style={{ width: `${Math.min(metaPercent(totaisDiarios.carb, plano.metaCarboidratos), 100)}%` }}
                  />
                </div>
              </div>
            )}
            {plano.metaGorduras != null && plano.metaGorduras > 0 && (
              <div className={styles.metaItem}>
                <div className={styles.metaLabelRow}>
                  <span className={styles.metaLabel}>Gorduras</span>
                  <span className={styles.metaNumbers}>
                    {totaisDiarios.gord.toFixed(1)} / {plano.metaGorduras}g
                  </span>
                </div>
                <div className={styles.metaProgressBar}>
                  <div
                    className={`${styles.metaProgressFill} ${metaPercent(totaisDiarios.gord, plano.metaGorduras) > 100 ? styles.over : ""}`}
                    style={{ width: `${Math.min(metaPercent(totaisDiarios.gord, plano.metaGorduras), 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Observações */}
      {plano.observacoes && (
        <div className={styles.observacoesView}>
          <span className={styles.observacoesLabel}>Observações</span>
          <p className={styles.observacoesText}>{plano.observacoes}</p>
        </div>
      )}

      {/* Refeições */}
      {plano.refeicoes.map((ref) => {
        const activeIdx = activeOpcoes[ref.id] || 0;
        const opcaoAtiva = ref.opcoes[activeIdx] || ref.opcoes[0];
        const totais = opcaoAtiva ? calcularTotaisAlimentos(opcaoAtiva.alimentos) : { cal: 0, prot: 0, carb: 0, gord: 0, fibra: 0 };

        return (
          <div key={ref.id} className={styles.refeicaoViewCard}>
            <div className={styles.refeicaoViewHeader}>
              <span className={styles.refeicaoViewName}>{ref.nome}</span>
              <span className={styles.refeicaoViewHorario}>{ref.horario}</span>
            </div>

            {/* Opções Tabs */}
            {ref.opcoes.length > 1 && (
              <div className={styles.opcoesTabs}>
                {ref.opcoes.map((opc, idx) => (
                  <button
                    key={opc.id}
                    className={`${styles.opcaoTab} ${idx === activeIdx ? styles.active : ""}`}
                    onClick={() =>
                      setActiveOpcoes((prev) => ({ ...prev, [ref.id]: idx }))
                    }
                  >
                    {opc.nome || `Opção ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Tabela de alimentos */}
            {opcaoAtiva && opcaoAtiva.alimentos.length > 0 && (
              <div className={styles.alimentosGridContainer}>
                <table className={styles.alimentosTable}>
                  <thead>
                    <tr>
                      <th>Alimento</th>
                      <th>Qtd</th>
                      <th>Unidade</th>
                      <th>Kcal</th>
                      <th>Prot (g)</th>
                      <th>Carb (g)</th>
                      <th>Gord (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opcaoAtiva.alimentos.map((al) => (
                      <tr key={al.id}>
                        <td>{al.alimento}</td>
                        <td>{al.quantidade}</td>
                        <td>{al.unidade}</td>
                        <td>{al.calorias?.toFixed(0) || "-"}</td>
                        <td>{al.proteinas?.toFixed(1) || "-"}</td>
                        <td>{al.carboidratos?.toFixed(1) || "-"}</td>
                        <td>{al.gorduras?.toFixed(1) || "-"}</td>
                      </tr>
                    ))}
                    <tr className={styles.totaisRow}>
                      <td colSpan={3}><strong>Total da Refeição</strong></td>
                      <td><strong>{totais.cal.toFixed(0)}</strong></td>
                      <td><strong>{totais.prot.toFixed(1)}</strong></td>
                      <td><strong>{totais.carb.toFixed(1)}</strong></td>
                      <td><strong>{totais.gord.toFixed(1)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {opcaoAtiva && opcaoAtiva.alimentos.length === 0 && (
              <p style={{ fontSize: "0.8125rem", color: "#9ca3af", padding: "0.75rem 0" }}>
                Nenhum alimento cadastrado nesta opção.
              </p>
            )}
          </div>
        );
      })}

      {/* Total Diário */}
      <div className={styles.totalDiarioCard}>
        <p className={styles.totalDiarioTitle}>Total Diário (Opção Principal)</p>
        <div className={styles.totalDiarioGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
          <div className={styles.totalDiarioItem}>
            <div className={styles.totalDiarioValue}>{Math.round(totaisDiarios.cal)}</div>
            <div className={styles.totalDiarioLabel}>Calorias (kcal)</div>
          </div>
          <div className={styles.totalDiarioItem}>
            <div className={styles.totalDiarioValue}>{totaisDiarios.prot.toFixed(1)}</div>
            <div className={styles.totalDiarioLabel}>Proteínas (g)</div>
          </div>
          <div className={styles.totalDiarioItem}>
            <div className={styles.totalDiarioValue}>{totaisDiarios.carb.toFixed(1)}</div>
            <div className={styles.totalDiarioLabel}>Carboidratos (g)</div>
          </div>
          <div className={styles.totalDiarioItem}>
            <div className={styles.totalDiarioValue}>{totaisDiarios.gord.toFixed(1)}</div>
            <div className={styles.totalDiarioLabel}>Gorduras (g)</div>
          </div>
          <div className={styles.totalDiarioItem}>
            <div className={styles.totalDiarioValue}>{totaisDiarios.fibra.toFixed(1)}</div>
            <div className={styles.totalDiarioLabel}>Fibras (g)</div>
          </div>
        </div>
        {plano.recomendacaoAguaMl && (
          <div className={styles.aguaRecomendacao}>
            <HugeiconsIcon icon={WavingHand02Icon} size={16} strokeWidth={2} />
            <span>Recomendação de água: {plano.recomendacaoAguaMl}ml / dia</span>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onDelete}
        title="Excluir Plano Alimentar"
        description={`Tem certeza que deseja excluir o plano alimentar "${plano.titulo}"?`}
        confirmText="Excluir"
        isPending={isDeleting}
      />
    </div>
  );
}
