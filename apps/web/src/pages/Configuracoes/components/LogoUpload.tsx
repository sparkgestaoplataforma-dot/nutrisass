import { useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ImageUploadIcon, Delete02Icon } from '@hugeicons/core-free-icons';
import { fileToResizedDataUrl } from '@/utils/image';
import styles from '../ConfigPage.module.scss';

interface LogoUploadProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  label?: string;
}

export function LogoUpload({ value, onChange, label = 'Logomarca' }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setErro(null);
      onChange(await fileToResizedDataUrl(file));
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  return (
    <div className={styles.field}>
      <label>{label}</label>
      <div className={styles.logoUpload}>
        <div className={styles.logoPreview}>
          {value ? <img src={value} alt="Logomarca" /> : <span>Sem logo</span>}
        </div>
        <div className={styles.logoActions}>
          <button type="button" className={styles.logoBtn} onClick={() => inputRef.current?.click()}>
            <HugeiconsIcon icon={ImageUploadIcon} size={14} strokeWidth={2} />
            {value ? 'Trocar' : 'Enviar imagem'}
          </button>
          {value && (
            <button
              type="button"
              className={`${styles.logoBtn} ${styles.logoBtnDanger}`}
              onClick={() => onChange(null)}
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
              Remover
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      </div>
      {erro && <span className={styles.fieldError}>{erro}</span>}
    </div>
  );
}
