import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlusSignIcon,
  PencilEdit01Icon,
  Delete02Icon,
  Search01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { api } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import type { CreateExameBaseInput } from '@nutricao/shared';
import styles from '../ConfigPage.module.scss';
import { Skeleton } from '@/components/Loading/Skeleton';

interface ExameBaseItem {
  id: string;
  codigo: string;
  nome: string;
  valorMinimo: number | null;
  valorMaximo: number | null;
  unidade: string | null;
  isBase: boolean;
}

export function ExamesBaseConfig() {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(1);
  const buscaDebounced = useDebounce(busca, 350);

  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [buscaDebounced]);

  const isDebouncing = busca !== buscaDebounced;

  const { data: responseData, isLoading, isFetching } = useQuery({
    queryKey: ['exames-base-config', buscaDebounced, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(buscaDebounced.trim() ? { search: buscaDebounced.trim() } : {}),
      });
      const { data } = await api.get(`/exames/base?${params}`);
      return data;
    },
  });

  const isSearching = isDebouncing || isLoading || isFetching;

  const exames: ExameBaseItem[] = responseData?.data || [];
  const total: number = responseData?.total ?? exames.length;
  const totalPages: number = responseData?.totalPages ?? 1;

  const { register, handleSubmit, reset } = useForm<CreateExameBaseInput>();

  const mutation = useMutation({
    mutationFn: async (data: CreateExameBaseInput) => {
      const payload = {
        ...data,
        valorMinimo: data.valorMinimo ? Number(data.valorMinimo) : undefined,
        valorMaximo: data.valorMaximo ? Number(data.valorMaximo) : undefined,
      };
      if (editandoId) return api.put(`/exames/base/${editandoId}`, payload);
      return api.post('/exames/base', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exames-base-config'] });
      queryClient.invalidateQueries({ queryKey: ['exames-base'] });
      queryClient.invalidateQueries({ queryKey: ['exames-page'] });
      fecharForm();
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/exames/base/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exames-base-config'] });
      queryClient.invalidateQueries({ queryKey: ['exames-base'] });
      queryClient.invalidateQueries({ queryKey: ['exames-page'] });
    },
  });

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
    reset({ codigo: '', nome: '', valorMinimo: undefined, valorMaximo: undefined, unidade: '' });
  }

  function editar(ex: ExameBaseItem) {
    setEditandoId(ex.id);
    reset({
      codigo: ex.codigo,
      nome: ex.nome,
      valorMinimo: ex.valorMinimo ?? undefined,
      valorMaximo: ex.valorMaximo ?? undefined,
      unidade: ex.unidade || '',
    });
    setFormAberto(true);
  }

  return (
    <div>
      <div className={styles.header}>
        <h3>Exames Base</h3>
        <div className={styles.headerRight}>
          <div className={styles.searchWrapper}>
            <HugeiconsIcon icon={Search01Icon} size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button className={styles.addBtn} onClick={() => { fecharForm(); setFormAberto(true); }}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} /> Novo Exame
          </button>
        </div>
      </div>

      {formAberto && (
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Código</label>
                <input {...register('codigo')} placeholder="Ex: GLI" />
              </div>
              <div className={styles.field}>
                <label>Nome</label>
                <input {...register('nome')} placeholder="Ex: Glicemia" />
              </div>
              <div className={styles.field}>
                <label>Valor Mínimo</label>
                <input type="number" step="0.01" {...register('valorMinimo')} />
              </div>
              <div className={styles.field}>
                <label>Valor Máximo</label>
                <input type="number" step="0.01" {...register('valorMaximo')} />
              </div>
              <div className={styles.field}>
                <label>Unidade</label>
                <input {...register('unidade')} placeholder="Ex: mg/dL" />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={fecharForm}>Cancelar</button>
              <button type="submit" className={styles.submitBtn} disabled={mutation.isPending}>
                {mutation.isPending ? 'Salvando...' : editandoId ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.container}>
        {isSearching ? (
          <table className={styles.table}>
            <thead>
              <tr><th>Código</th><th>Nome</th><th>Min</th><th>Máx</th><th>Unidade</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td data-label="Código">
                    <Skeleton width={i % 2 === 0 ? "60px" : "45px"} height={16} borderRadius={4} />
                  </td>
                  <td data-label="Nome">
                    <Skeleton width={i % 2 === 0 ? "70%" : "50%"} height={16} borderRadius={4} />
                  </td>
                  <td data-label="Min">
                    <Skeleton width={32} height={16} borderRadius={4} />
                  </td>
                  <td data-label="Máx">
                    <Skeleton width={32} height={16} borderRadius={4} />
                  </td>
                  <td data-label="Unidade">
                    <Skeleton width={45} height={16} borderRadius={4} />
                  </td>
                  <td data-label="Ações">
                    <div className={styles.actions}>
                      <Skeleton width={28} height={28} borderRadius={6} />
                      <Skeleton width={28} height={28} borderRadius={6} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : exames.length === 0 ? (
          <div className={styles.empty}>
            {buscaDebounced ? 'Nenhum exame encontrado para a busca.' : 'Nenhum exame base cadastrado.'}
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr><th>Código</th><th>Nome</th><th>Min</th><th>Máx</th><th>Unidade</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {exames.map((ex) => (
                  <tr key={ex.id}>
                    <td data-label="Código">{ex.codigo}</td>
                    <td data-label="Nome">{ex.nome}</td>
                    <td data-label="Min">{ex.valorMinimo ?? '-'}</td>
                    <td data-label="Máx">{ex.valorMaximo ?? '-'}</td>
                    <td data-label="Unidade">{ex.unidade || '-'}</td>
                    <td data-label="Ações">
                      <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={() => editar(ex)} title="Editar">
                          <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.danger}`}
                          onClick={() => { if (confirm('Excluir exame?')) excluirMutation.mutate(ex.id); }}
                          title="Excluir"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.footer}>
              <span className={styles.pageInfo}>
                Mostrando {exames.length} de {total} exame{total === 1 ? '' : 's'}
              </span>
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label="Página anterior"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  </button>
                  <span className={styles.pageInfo}>Página {page} de {totalPages}</span>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Próxima página"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
