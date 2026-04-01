import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarAdd01FreeIcons,
  CheckListIcon,
} from "@hugeicons/core-free-icons";
import styles from "./../ComparativoPage.module.scss";

type PacienteSelecionado = {
  id: string;
  nome: string;
};

interface FilterComparativoProps {
  paciente: PacienteSelecionado;
  busca: string;
  setBusca: React.Dispatch<React.SetStateAction<string>>;
  handleAbrirQuestionarios: (paciente: PacienteSelecionado) => void;
  handleAbrirRangeData: () => void;
}
export function FilterComparativo({
  paciente,
  busca,
  setBusca,
  handleAbrirQuestionarios,
  handleAbrirRangeData,
}: FilterComparativoProps) {
  return (
    <>
      <div className={styles.filterRow}>
        <input
          type="text"
          className={styles.searchBox}
          placeholder="Buscar por data..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <button
          className={styles.rangeBtn}
          onClick={handleAbrirRangeData}
          title="Adicionar Range"
        >
          <span>Filtrar datas</span>
          <HugeiconsIcon
            icon={CalendarAdd01FreeIcons}
            size={14}
            strokeWidth={2}
          />
        </button>
      </div>

      <button
        className={`${styles.novoBtn}`}
        onClick={() =>
          handleAbrirQuestionarios({
            id: paciente?.id || "",
            nome: paciente?.nome || "",
          })
        }
        title="Aplicar questionário"
      >
        <span>Responder um novo exame</span>
        <HugeiconsIcon icon={CheckListIcon} size={14} strokeWidth={2} />
      </button>
    </>
  );
}
