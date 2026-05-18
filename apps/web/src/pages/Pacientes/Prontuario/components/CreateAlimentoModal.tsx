import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, PlusSignIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { api } from "@/services/api";
import type { AlimentoAPI } from "@/services/planoAlimentar";
import styles from "./PlanoAlimentar.module.scss";

interface MedidaCaseiraLocal {
  nome: string;
  quantidadeEmGramas: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess: (alimento: AlimentoAPI) => void;
}

// Sugestões de unidades comuns para facilitar o preenchimento
const UNIDADES_SUGERIDAS = [
  "colher de sopa",
  "colher de chá",
  "xícara",
  "copo (200ml)",
  "fatia",
  "unidade",
  "porção",
  "ml (mililitro)",
  "l (litros)",
];

export function CreateAlimentoModal({ isOpen, onClose, initialName, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm<any>();
  const [medidasCaseiras, setMedidasCaseiras] = useState<MedidaCaseiraLocal[]>([]);
  const [nomeMedida, setNomeMedida] = useState("");
  const [qtdGramas, setQtdGramas] = useState("");

  useEffect(() => {
    if (isOpen) {
      reset({
        nome: initialName || "",
        grupo: "",
        calorias: "",
        proteinas: "",
        carboidratos: "",
        gorduras: "",
        fibra: "",
      });
      setMedidasCaseiras([]);
      setNomeMedida("");
      setQtdGramas("");
    }
  }, [isOpen, initialName, reset]);

  function addMedida() {
    const nome = nomeMedida.trim();
    const qtd = parseFloat(qtdGramas);
    if (!nome || isNaN(qtd) || qtd <= 0) return;
    setMedidasCaseiras((prev) => [...prev, { nome, quantidadeEmGramas: qtd }]);
    setNomeMedida("");
    setQtdGramas("");
  }

  function removeMedida(idx: number) {
    setMedidasCaseiras((prev) => prev.filter((_, i) => i !== idx));
  }

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        ...formData,
        calorias: formData.calorias ? Number(formData.calorias) : undefined,
        proteinas: formData.proteinas ? Number(formData.proteinas) : undefined,
        carboidratos: formData.carboidratos ? Number(formData.carboidratos) : undefined,
        gorduras: formData.gorduras ? Number(formData.gorduras) : undefined,
        fibra: formData.fibra ? Number(formData.fibra) : undefined,
        medidasCaseiras: medidasCaseiras.length > 0 ? medidasCaseiras : undefined,
      };
      const response = await api.post("/alimentos", payload);
      return response.data;
    },
    onSuccess: (data) => {
      onSuccess(data.data as AlimentoAPI);
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Adicionar Novo Alimento</h3>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className={styles.modalForm}>
          <div className={styles.modalField} style={{ gridColumn: "1 / -1" }}>
            <label>Nome do Alimento</label>
            <input {...register("nome", { required: true })} placeholder="Ex: Whey Protein Concentrado" />
          </div>
          <div className={styles.modalField} style={{ gridColumn: "1 / -1" }}>
            <label>Grupo (Opcional)</label>
            <input {...register("grupo")} placeholder="Ex: Suplementos" />
          </div>

          <div className={styles.modalMacrosGrid}>
            <div className={styles.modalField}>
              <label>Kcal</label>
              <input type="number" step="0.01" {...register("calorias")} placeholder="0" />
            </div>
            <div className={styles.modalField}>
              <label>Proteínas (g)</label>
              <input type="number" step="0.01" {...register("proteinas")} placeholder="0" />
            </div>
            <div className={styles.modalField}>
              <label>Carboidratos (g)</label>
              <input type="number" step="0.01" {...register("carboidratos")} placeholder="0" />
            </div>
            <div className={styles.modalField}>
              <label>Gorduras (g)</label>
              <input type="number" step="0.01" {...register("gorduras")} placeholder="0" />
            </div>
            <div className={styles.modalField}>
              <label>Fibras (g)</label>
              <input type="number" step="0.01" {...register("fibra")} placeholder="0" />
            </div>
          </div>

          {/* Seção de Medidas Caseiras */}
          <div className={styles.modalField} style={{ gridColumn: "1 / -1" }}>
            <label style={{ marginBottom: "0.5rem", display: "block" }}>
              Medidas Caseiras (Opcional)
            </label>

            {/* Medidas adicionadas */}
            {medidasCaseiras.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginBottom: "0.75rem" }}>
                {medidasCaseiras.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "var(--color-surface, #f3f4f6)",
                      borderRadius: "6px",
                      padding: "0.375rem 0.625rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ flex: 1 }}>{m.nome}</span>
                    <span style={{ color: "var(--color-muted, #6b7280)", whiteSpace: "nowrap" }}>
                      = {m.quantidadeEmGramas}g
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMedida(i)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        padding: "2px",
                      }}
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Campos para adicionar nova medida */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: "0.5rem", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--color-muted, #6b7280)", marginBottom: "0.25rem", display: "block" }}>
                  Nome da medida
                </label>
                <input
                  list="unidades-sugeridas"
                  value={nomeMedida}
                  onChange={(e) => setNomeMedida(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMedida();
                    }
                  }}
                  placeholder="Ex: colher de sopa"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    background: "var(--color-input-bg, #fff)",
                    color: "inherit",
                  }}
                />
                <datalist id="unidades-sugeridas">
                  {UNIDADES_SUGERIDAS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--color-muted, #6b7280)", marginBottom: "0.25rem", display: "block" }}>
                  Equiv. em gramas
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={qtdGramas}
                  onChange={(e) => setQtdGramas(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMedida();
                    }
                  }}
                  placeholder="15"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    background: "var(--color-input-bg, #fff)",
                    color: "inherit",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={addMedida}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                  padding: "0.5rem 0.75rem",
                  background: "var(--color-primary, #4f46e5)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  whiteSpace: "nowrap",
                  height: "38px",
                }}
              >
                <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} />
                Adicionar
              </button>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--color-muted, #9ca3af)", marginTop: "0.375rem" }}>
              Informe quanto cada medida equivale em gramas. Ex: "colher de sopa" = 15g
            </p>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.modalSubmitBtn} disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Adicionar ao Plano"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
