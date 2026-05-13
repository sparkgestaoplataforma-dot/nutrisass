import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { api } from "@/services/api";
import type { AlimentoAPI } from "@/services/planoAlimentar";
import styles from "./PlanoAlimentar.module.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess: (alimento: AlimentoAPI) => void;
}

export function CreateAlimentoModal({ isOpen, onClose, initialName, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm<any>();

  useEffect(() => {
    if (isOpen) {
      reset({
        nome: initialName || '',
        grupo: '',
        calorias: '',
        proteinas: '',
        carboidratos: '',
        gorduras: '',
        fibra: ''
      });
    }
  }, [isOpen, initialName, reset]);

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        ...formData,
        calorias: formData.calorias ? Number(formData.calorias) : undefined,
        proteinas: formData.proteinas ? Number(formData.proteinas) : undefined,
        carboidratos: formData.carboidratos ? Number(formData.carboidratos) : undefined,
        gorduras: formData.gorduras ? Number(formData.gorduras) : undefined,
        fibra: formData.fibra ? Number(formData.fibra) : undefined,
      };
      const response = await api.post('/alimentos', payload);
      return response.data;
    },
    onSuccess: (data) => {
      // O data que a API retorna para criar é { success: true, data: AlimentoAPI }
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
          <div className={styles.modalField} style={{ gridColumn: '1 / -1' }}>
            <label>Nome do Alimento</label>
            <input {...register('nome', { required: true })} placeholder="Ex: Whey Protein Concentrado" />
          </div>
          <div className={styles.modalField} style={{ gridColumn: '1 / -1' }}>
            <label>Grupo (Opcional)</label>
            <input {...register('grupo')} placeholder="Ex: Suplementos" />
          </div>
          
          <div className={styles.modalMacrosGrid}>
            <div className={styles.modalField}>
              <label>Kcal</label>
              <input type="number" step="0.01" {...register('calorias')} placeholder="0" />
            </div>
            <div className={styles.modalField}>
              <label>Proteínas (g)</label>
              <input type="number" step="0.01" {...register('proteinas')} placeholder="0" />
            </div>
            <div className={styles.modalField}>
              <label>Carboidratos (g)</label>
              <input type="number" step="0.01" {...register('carboidratos')} placeholder="0" />
            </div>
            <div className={styles.modalField}>
              <label>Gorduras (g)</label>
              <input type="number" step="0.01" {...register('gorduras')} placeholder="0" />
            </div>
            <div className={styles.modalField}>
              <label>Fibras (g)</label>
              <input type="number" step="0.01" {...register('fibra')} placeholder="0" />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.modalSubmitBtn} disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Adicionar ao Plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
