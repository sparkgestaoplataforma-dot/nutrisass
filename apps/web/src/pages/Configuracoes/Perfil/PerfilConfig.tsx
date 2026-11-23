import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { UpdateMeuPerfilInput } from '@nutricao/shared';
import { obterMeuPerfil, atualizarMeuPerfil } from '@/services/usuario';
import styles from '../ConfigPage.module.scss';

/**
 * Dados profissionais do usuário autenticado (Nome e CRN).
 * Exibidos na assinatura de planos alimentares, guias TISS e avaliações impressas.
 */
export function PerfilConfig() {
  const queryClient = useQueryClient();
  const [salvo, setSalvo] = useState(false);

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['meu-perfil'],
    queryFn: obterMeuPerfil,
  });

  const { register, handleSubmit, reset } = useForm<UpdateMeuPerfilInput>();

  useEffect(() => {
    if (!perfil) return;
    reset({
      nome: perfil.nome,
      crn: perfil.crn || '',
    });
  }, [perfil, reset]);

  const mutation = useMutation({
    mutationFn: (data: UpdateMeuPerfilInput) => atualizarMeuPerfil(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['meu-perfil'], updated);
      queryClient.invalidateQueries({ queryKey: ['usuarios-config'] });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    },
  });

  if (isLoading) return <div className={styles.empty}>Carregando...</div>;

  return (
    <div>
      <div className={styles.header}>
        <h3>Meu Perfil Profissional</h3>
      </div>
      <p className={styles.hint}>
        Seu nome e número do CRN aparecem automaticamente nas assinaturas dos PDFs de planos alimentares, avaliações físicas e guias TISS.
      </p>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nome completo</label>
              <input {...register('nome')} placeholder="Seu nome profissional" />
            </div>
            <div className={styles.field}>
              <label>CRN (Conselho Regional de Nutricionistas)</label>
              <input {...register('crn')} placeholder="Ex: CRN-3 12345/P" maxLength={30} />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label>E-mail de acesso</label>
              <input value={perfil?.email || ''} disabled />
            </div>
          </div>

          {mutation.isError && (
            <p className={styles.fieldError}>
              {(mutation.error as any)?.response?.data?.message || 'Erro ao salvar perfil'}
            </p>
          )}

          <div className={styles.formActions}>
            {salvo && <span className={styles.savedMsg}>Dados salvos!</span>}
            <button type="submit" className={styles.submitBtn} disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

