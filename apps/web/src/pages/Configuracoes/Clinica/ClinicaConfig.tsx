import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { UpdateClinicaInput } from '@nutricao/shared';
import { getClinica, atualizarClinica } from '@/services/clinica';
import { LogoUpload } from '../components/LogoUpload';
import styles from '../ConfigPage.module.scss';

/**
 * Dados da clínica usados no cabeçalho timbrado das impressões
 * (medidas, guia TISS, etc).
 */
export function ClinicaConfig() {
  const queryClient = useQueryClient();
  const [logomarca, setLogomarca] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const { data: clinica, isLoading } = useQuery({
    queryKey: ['clinica'],
    queryFn: getClinica,
  });

  const { register, handleSubmit, reset } = useForm<UpdateClinicaInput>();

  useEffect(() => {
    if (!clinica) return;
    reset({
      nome: clinica.nome,
      cnpj: clinica.cnpj || '',
      telefone: clinica.telefone || '',
      email: clinica.email || '',
      endereco: clinica.endereco || '',
    });
    setLogomarca(clinica.logomarca);
  }, [clinica, reset]);

  const mutation = useMutation({
    mutationFn: (data: UpdateClinicaInput) => atualizarClinica({ ...data, logomarca }),
    onSuccess: (data) => {
      queryClient.setQueryData(['clinica'], data);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    },
  });

  if (isLoading) return <div className={styles.empty}>Carregando...</div>;

  return (
    <div>
      <div className={styles.header}>
        <h3>Dados da Clínica</h3>
      </div>
      <p className={styles.hint}>
        Estas informações aparecem no cabeçalho timbrado das impressões (medidas, guia TISS).
      </p>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nome</label>
              <input {...register('nome')} placeholder="Nome da clínica" />
            </div>
            <div className={styles.field}>
              <label>CNPJ</label>
              <input {...register('cnpj')} placeholder="00.000.000/0000-00" />
            </div>
            <div className={styles.field}>
              <label>Telefone</label>
              <input {...register('telefone')} placeholder="(00) 0000-0000" />
            </div>
            <div className={styles.field}>
              <label>E-mail</label>
              <input type="email" {...register('email')} placeholder="contato@clinica.com" />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label>Endereço</label>
              <input {...register('endereco')} placeholder="Rua, número, bairro, cidade - UF" />
            </div>
            <div className={styles.fullWidth}>
              <LogoUpload value={logomarca} onChange={setLogomarca} />
            </div>
          </div>
          {mutation.isError && (
            <p className={styles.fieldError}>
              {(mutation.error as any)?.response?.data?.message || 'Erro ao salvar dados da clínica'}
            </p>
          )}
          <div className={styles.formActions}>
            {salvo && <span className={styles.savedMsg}>Dados salvos!</span>}
            <button type="submit" className={styles.submitBtn} disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
