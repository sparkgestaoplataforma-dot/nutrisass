import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarAdd01FreeIcons } from "@hugeicons/core-free-icons";
import styles from "./../ComparativoPage.module.scss";

interface FilterComparativoProps {
  filtroData: string;
  setFiltroData: React.Dispatch<React.SetStateAction<string>>;
  handleAbrirRangeData: () => void;
}
export function FilterComparativo({
  filtroData,
  setFiltroData,
  handleAbrirRangeData,
}: FilterComparativoProps) {
  return (
    <div className={styles.filterRow}>
      <button
        className={styles.rangeBtn}
        onClick={handleAbrirRangeData}
        title="Adicionar intervalo"
      >
        <span>Filtrar datas</span>
        <HugeiconsIcon
          icon={CalendarAdd01FreeIcons}
          size={14}
          strokeWidth={2}
        />
      </button>

      <input
        type="date"
        className={styles.searchBox}
        value={filtroData}
        onChange={(e) => setFiltroData(e.target.value)}
        aria-label="Filtrar por data exata"
      />
    </div>
  );
}
