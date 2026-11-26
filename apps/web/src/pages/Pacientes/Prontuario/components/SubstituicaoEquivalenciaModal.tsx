import { useEffect, useMemo, useRef, useState } from "react";
import type { AlimentoAPI } from "@/services/planoAlimentar";
import {
  type AlimentoCalculavel,
  type CriterioEquivalencia,
  LIMITE_MAX_GRAMAS_SUBSTITUICAO,
  LIMITE_MIN_GRAMAS_SUBSTITUICAO,
  calcularSubstituicaoEquivalente,
  obterPreviewSubstituicao,
} from "@/utils/nutricaoCalculos";
import { AlimentoSearch } from "./AlimentoSearch";
import { MAX_OPCOES_REFEICAO, podeCriarNovaOpcao } from "./planoAlimentarHelpers";
import styles from "./PlanoAlimentar.module.scss";

interface SubstituicaoEquivalenciaModalProps {
  alimentoOriginal: AlimentoCalculavel | null;
  totalOpcoesRefeicao: number;
  defaultCriterio: CriterioEquivalencia;
  gerarUid: () => string;
  onClose: () => void;
  onSubstituirItem: (novoAlimento: AlimentoCalculavel) => void;
  onCriarNovaOpcao: (novoAlimento: AlimentoCalculavel) => void;
}

const CRITERIOS_OPCOES: ReadonlyArray<{ key: CriterioEquivalencia; label: string }> = [
  { key: "CARBOIDRATOS", label: "Carboidratos (g)" },
  { key: "PROTEINAS", label: "Proteínas (g)" },
  { key: "GORDURAS", label: "Gorduras (g)" },
  { key: "CALORIAS", label: "Calorias (kcal)" },
];

export function SubstituicaoEquivalenciaModal({
  alimentoOriginal,
  totalOpcoesRefeicao,
  defaultCriterio,
  gerarUid,
  onClose,
  onSubstituirItem,
  onCriarNovaOpcao,
}: SubstituicaoEquivalenciaModalProps) {
  const [criterioEquiv, setCriterioEquiv] = useState<CriterioEquivalencia>(defaultCriterio);
  const [substitutoCandidato, setSubstitutoCandidato] = useState<AlimentoAPI | null>(null);
  const [usarMedidaCaseiraEquiv, setUsarMedidaCaseiraEquiv] = useState(false);
  const appliedRef = useRef(false);

  useEffect(() => {
    setCriterioEquiv(defaultCriterio);
    setSubstitutoCandidato(null);
    setUsarMedidaCaseiraEquiv(false);
    appliedRef.current = false;
  }, [alimentoOriginal, defaultCriterio]);

  useEffect(() => {
    if (!alimentoOriginal) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [alimentoOriginal, onClose]);

  const resultadoEquivalencia = useMemo(() => {
    if (!alimentoOriginal || !substitutoCandidato) return null;
    return calcularSubstituicaoEquivalente(
      alimentoOriginal,
      substitutoCandidato,
      criterioEquiv,
      "preview",
    );
  }, [alimentoOriginal, substitutoCandidato, criterioEquiv]);

  const preview = useMemo(() => {
    if (!resultadoEquivalencia) return null;
    return obterPreviewSubstituicao(resultadoEquivalencia, usarMedidaCaseiraEquiv);
  }, [resultadoEquivalencia, usarMedidaCaseiraEquiv]);

  if (!alimentoOriginal) return null;

  const limiteOpcoesAtingido = !podeCriarNovaOpcao(totalOpcoesRefeicao);

  function confirmarSubstituicao(criarNovaOpcao: boolean) {
    if (!preview || appliedRef.current) return;
    if (criarNovaOpcao && limiteOpcoesAtingido) return;

    appliedRef.current = true;
    const alimentoFinal: AlimentoCalculavel = {
      ...preview.alimentoFinal,
      _uid: gerarUid(),
    };

    if (criarNovaOpcao) {
      onCriarNovaOpcao(alimentoFinal);
    } else {
      onSubstituirItem(alimentoFinal);
    }
  }

  const labelCriterioSolicitado =
    CRITERIOS_OPCOES.find((c) => c.key === criterioEquiv)?.label ?? criterioEquiv;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${styles.modalWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="substituicao-equiv-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 id="substituicao-equiv-modal-title">⇄ Substituição Inteligente por Equivalência</h3>
          <button
            type="button"
            className={styles.modalCloseBtn}
            aria-label="Fechar"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalForm}>
          <div className={styles.equivOriginBox}>
            <span>Alimento original na refeição:</span>
            <strong>
              {alimentoOriginal.quantidade} {alimentoOriginal.unidade} de {alimentoOriginal.alimento}
            </strong>
            <span>
              {Math.round(alimentoOriginal.calorias ?? 0)} kcal • Carb:{" "}
              {(alimentoOriginal.carboidratos ?? 0).toFixed(1)}g • Prot:{" "}
              {(alimentoOriginal.proteinas ?? 0).toFixed(1)}g • Gord:{" "}
              {(alimentoOriginal.gorduras ?? 0).toFixed(1)}g
            </span>
          </div>

          <div className={styles.modalField}>
            <label>1. Igualar automaticamente por qual critério nutricional?</label>
            <div className={styles.equivCriteriaPills}>
              {CRITERIOS_OPCOES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`${styles.equivCriterionPill} ${
                    criterioEquiv === c.key ? styles.equivCriterionPillActive : ""
                  }`}
                  onClick={() => setCriterioEquiv(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.modalField}>
            <label>2. Escolha o alimento substituto (TACO ou personalizado):</label>
            <AlimentoSearch
              onSelect={(al) => {
                setSubstitutoCandidato(al);
                setUsarMedidaCaseiraEquiv(false);
              }}
            />
          </div>

          {substitutoCandidato && !resultadoEquivalencia && (
            <div className={styles.equivErrorBox} role="alert">
              <strong>Não foi possível calcular a equivalência nutricional</strong>
              <span>
                O alimento original ou o substituto selecionado ({substitutoCandidato.nome}) não
                possui valores válidos maiores que zero para{" "}
                <strong>{labelCriterioSolicitado}</strong> nem para <strong>Calorias</strong>.
                Escolha outro alimento ou ajuste o item original antes de substituir.
              </span>
            </div>
          )}

          {substitutoCandidato && resultadoEquivalencia && preview && (
            <div className={styles.equivResultBox}>
              {resultadoEquivalencia.usouFallbackCalorias && (
                <div className={styles.equivWarningBanner} role="status">
                  Critério alternativo aplicado: o alimento não possui valores suficientes para{" "}
                  <strong>{labelCriterioSolicitado}</strong>, portanto o cálculo foi feito por{" "}
                  <strong>Calorias (kcal)</strong>.
                </div>
              )}

              {resultadoEquivalencia.limiteAplicado === "MINIMO" && (
                <div className={styles.equivWarningBanner} role="status">
                  A equivalência exata exigiria {resultadoEquivalencia.gramasCalculadasSemLimite} g,
                  abaixo do limite mínimo seguro de {LIMITE_MIN_GRAMAS_SUBSTITUICAO} g. A
                  quantidade foi ajustada para {LIMITE_MIN_GRAMAS_SUBSTITUICAO} g (a equivalência
                  solicitada não foi atingida exatamente).
                </div>
              )}

              {resultadoEquivalencia.limiteAplicado === "MAXIMO" && (
                <div className={styles.equivWarningBanner} role="status">
                  A equivalência exata exigiria {resultadoEquivalencia.gramasCalculadasSemLimite} g,
                  acima do limite máximo de {LIMITE_MAX_GRAMAS_SUBSTITUICAO} g. A quantidade foi
                  limitada a {LIMITE_MAX_GRAMAS_SUBSTITUICAO} g (a equivalência solicitada não foi
                  atingida exatamente).
                </div>
              )}

              <div>
                <span>
                  Quantidade {preview.usandoMedidaCaseira ? "aplicada (medida caseira)" : "equivalente calculada"}{" "}
                  para {substitutoCandidato.nome}:
                </span>
                <div>
                  {preview.usandoMedidaCaseira && resultadoEquivalencia.sugestaoMedidaCaseira ? (
                    <>
                      <strong>
                        {resultadoEquivalencia.sugestaoMedidaCaseira.quantidadeUnidades}x{" "}
                        {resultadoEquivalencia.sugestaoMedidaCaseira.nome}
                      </strong>{" "}
                      <span>
                        ({preview.gramasEfetivas} g • equiv. exata:{" "}
                        {resultadoEquivalencia.gramasEquivalentes} g)
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>{preview.gramasEfetivas} g</strong>
                      {resultadoEquivalencia.sugestaoMedidaCaseira && (
                        <span style={{ marginLeft: "0.5rem" }}>
                          (≈ {resultadoEquivalencia.sugestaoMedidaCaseira.quantidadeUnidades}x{" "}
                          {resultadoEquivalencia.sugestaoMedidaCaseira.nome} ={" "}
                          {resultadoEquivalencia.sugestaoMedidaCaseira.gramasResultantes} g)
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                Resulta em:{" "}
                <strong>
                  {Math.round(preview.alimentoFinal.calorias ?? 0)} kcal
                </strong>{" "}
                ({preview.diferencaKcal >= 0 ? "+" : ""}
                {preview.diferencaKcal} kcal vs. original) • Carb:{" "}
                {(preview.alimentoFinal.carboidratos ?? 0).toFixed(1)}g • Prot:{" "}
                {(preview.alimentoFinal.proteinas ?? 0).toFixed(1)}g • Gord:{" "}
                {(preview.alimentoFinal.gorduras ?? 0).toFixed(1)}g
              </div>

              {resultadoEquivalencia.sugestaoMedidaCaseira && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={usarMedidaCaseiraEquiv}
                    onChange={(e) => setUsarMedidaCaseiraEquiv(e.target.checked)}
                  />
                  Usar medida caseira arredondada (
                  {resultadoEquivalencia.sugestaoMedidaCaseira.quantidadeUnidades}x{" "}
                  {resultadoEquivalencia.sugestaoMedidaCaseira.nome}) em vez de gramas
                </label>
              )}

              {limiteOpcoesAtingido && (
                <p className={styles.optionLimitHint} role="status">
                  Limite máximo de {MAX_OPCOES_REFEICAO} opções atingido nesta refeição. Use
                  &quot;Substituir Item Atual&quot; ou remova uma opção antes de criar outra.
                </p>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.templateBtn}
                  disabled={limiteOpcoesAtingido}
                  onClick={() => confirmarSubstituicao(true)}
                  title={
                    limiteOpcoesAtingido
                      ? `O limite máximo é de ${MAX_OPCOES_REFEICAO} opções por refeição`
                      : "Mantém a opção atual intacta e cria uma nova Opção de Substituição nesta refeição"
                  }
                >
                  + Criar Nova Opção com esta Troca
                </button>
                <button
                  type="button"
                  className={styles.modalSubmitBtn}
                  onClick={() => confirmarSubstituicao(false)}
                >
                  Substituir Item Atual
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
