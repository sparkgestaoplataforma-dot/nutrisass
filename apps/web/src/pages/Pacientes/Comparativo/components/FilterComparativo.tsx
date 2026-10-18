import { useState } from 'react';
import styles from "./../ComparativoPage.module.scss";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

interface FilterComparativoProps {
  dataInicio: string;
  setDataInicio: React.Dispatch<React.SetStateAction<string>>;
  dataFim: string;
  setDataFim: React.Dispatch<React.SetStateAction<string>>;
}

export function FilterComparativo({
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
}: FilterComparativoProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className={styles.filterContainer}>
      {/* Botão de Toggle visível apenas no Mobile */}
      <button
        type="button"
        className={styles.filterMobileToggleBtn}
        onClick={() => setIsOpenMobile(!isOpenMobile)}
      >
        <HugeiconsIcon icon={Calendar01Icon} size={18} strokeWidth={2} />
        <span>{isOpenMobile ? "Ocultar Filtros de Data" : "Filtrar por Período"}</span>
      </button>

      {/* Inputs de Data - Colapsáveis condicionalmente no Mobile */}
      <div className={`${styles.filterRangeInline} ${!isOpenMobile ? styles.collapsed : ""}`}>
        <span className={styles.filterTag}>De</span>
        <input
          type="date"
          lang="pt-BR"
          className={styles.filterDateInput}
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          aria-label="Filtrar de"
          title="Data inicial"
        />

        <span className={styles.filterTag}>Até</span>
        <input
          type="date"
          lang="pt-BR"
          className={styles.filterDateInput}
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          aria-label="Filtrar até"
          title="Data final"
        />
      </div>
    </div>
  );
}
