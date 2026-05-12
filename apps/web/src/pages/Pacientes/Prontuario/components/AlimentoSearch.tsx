import { useState, useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { buscarAlimentos, type AlimentoAPI } from "@/services/planoAlimentar";
import styles from "./PlanoAlimentar.module.scss";

interface Props {
  onSelect: (alimento: AlimentoAPI) => void;
}

export function AlimentoSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlimentoAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(true);
    setOpen(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await buscarAlimentos(query, 1, 15);
        setResults(res.data);
        setOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  function handleSelect(al: AlimentoAPI) {
    onSelect(al);
    setQuery("");
    setOpen(false);
    setResults([]);
  }

  return (
    <div className={styles.alimentoSearchWrapper} ref={wrapperRef}>
      <span className={styles.searchIcon}>
        {loading ? (
          <span className={styles.searchSpinner} />
        ) : (
          <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={2} />
        )}
      </span>
      <input
        className={styles.alimentoSearchInput}
        placeholder="Buscar alimento (ex: arroz, frango, whey)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
      />
      {open && (
        <div className={styles.searchDropdown}>
          {loading && (
            <div className={styles.searchLoading}>
              <span className={styles.searchSpinnerLg} />
              Buscando alimentos...
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className={styles.searchEmpty}>Nenhum alimento encontrado.</div>
          )}
          {!loading && results.map((al) => (
            <div key={al.id} className={styles.searchItem} onClick={() => handleSelect(al)}>
              <div>
                <div className={styles.searchItemName}>{al.nome}</div>
                {al.grupo && <div className={styles.searchItemGrupo}>{al.grupo}</div>}
              </div>
              <div className={styles.searchItemMacros}>
                {al.calorias?.toFixed(0) || 0} kcal / 100g
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
