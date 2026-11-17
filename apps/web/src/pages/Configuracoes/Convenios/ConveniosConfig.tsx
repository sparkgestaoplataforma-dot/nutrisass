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
import {
  listarConveniosPaginado,
  criarConvenio,
  editarConvenio,
  excluirConvenio,
} from '@/services/convenios';
import { useAuthStore } from '@/stores/authStore';
import { useIsAutonomo } from '@/hooks/useIsAutonomo';
import { useDebounce } from '@/hooks/useDebounce';
import type { CreateConvenioInput } from '@nutricao/shared';
import styles from '../ConfigPage.module.scss';
import { LogoUpload } from '../components/LogoUpload';
import { Skeleton } from '@/components/Loading/Skeleton';

interface Convenio {
  id: string;
  nome: string;
  registroANS?: string | null;
  logomarca?: string | null;
}

export function ConveniosConfig() {
  const user = useAuthStore((s) => s.user);
  const isAutonomo = useIsAutonomo();
  const isAdmin = user?.perfil === 'ADMIN' || isAutonomo;

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [logomarca, setLogomarca] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(1);
  const buscaDebounced = useDebounce(busca, 350);

  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [buscaDebounced]);

  const isDebouncing = busca !== buscaDebounced;

  const { data: responseData, isLoading, isFetching } = useQuery({
    queryKey: ['convenios-config', buscaDebounced, page],
    queryFn: () =>
      listarConveniosPaginado({
        page,
        limit: 10,
        search: buscaDebounced,
      }),
  });

  const isSearching = isDebouncing || isLoading || isFetching;

  const convenios: Convenio[] = responseData?.data || [];
  const total: number = responseData?.total ?? convenios.length;
  const totalPages: number = responseData?.totalPages ?? 1;

  const { register, handleSubmit, reset } = useForm<CreateConvenioInput>();

  const mutation = useMutation({
    mutationFn: async (input: CreateConvenioInput) => {
      const data = { ...input, logomarca };
      if (editandoId) return editarConvenio(editandoId, data);
      return criarConvenio(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convenios-config'] });
      queryClient.invalidateQueries({ queryKey: ['convenios-select'] });
      fecharForm();
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => excluirConvenio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convenios-config'] });
    },
  });

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
    setLogomarca(null);
    reset({ nome: '', registroANS: '' });
  }

  function editar(conv: Convenio) {
    if (!isAdmin) return;
    setEditandoId(conv.id);
    setLogomarca(conv.logomarca || null);
    reset({ nome: conv.nome, registroANS: conv.registroANS || '' });
    setFormAberto(true);
  }

  return (
    <div>
      <div className={styles.header}>
        <h3>Convênios</h3>
        <div className={styles.headerRight}>
          <div className={styles.searchWrapper}>
            <HugeiconsIcon icon={Search01Icon} size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar convênio..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button className={styles.addBtn} onClick={() => { fecharForm(); setFormAberto(true); }}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} /> Novo Convênio
            </button>
          )}
        </div>
      </div>

      {isAdmin && formAberto && (
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Nome</label>
                <input {...register('nome')} placeholder="Nome do convênio" />
              </div>
              <div className={styles.field}>
                <label>Registro ANS</label>
                <input {...register('registroANS')} placeholder="Opcional" />
              </div>
              <div className={styles.fullWidth}>
                <LogoUpload value={logomarca} onChange={setLogomarca} label="Logomarca da operadora" />
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
              <tr>
                <th>Logo</th>
                <th>Nome</th>
                <th>Registro ANS</th>
                {isAdmin && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td data-label="Logo">
                    <Skeleton width={32} height={32} borderRadius={6} />
                  </td>
                  <td data-label="Nome">
                    <Skeleton width={i % 2 === 0 ? "65%" : "45%"} height={16} borderRadius={4} />
                  </td>
                  <td data-label="Registro ANS">
                    <Skeleton width={i % 2 === 0 ? "40%" : "30%"} height={16} borderRadius={4} />
                  </td>
                  {isAdmin && (
                    <td data-label="Ações">
                      <div className={styles.actions}>
                        <Skeleton width={28} height={28} borderRadius={6} />
                        <Skeleton width={28} height={28} borderRadius={6} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : convenios.length === 0 ? (
          <div className={styles.empty}>
            {buscaDebounced ? 'Nenhum convênio encontrado para a busca.' : 'Nenhum convênio cadastrado.'}
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Nome</th>
                  <th>Registro ANS</th>
                  {isAdmin && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {convenios.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Logo">
                      {c.logomarca ? <img className={styles.logoThumb} src={c.logomarca} alt="" /> : '-'}
                    </td>
                    <td data-label="Nome">{c.nome}</td>
                    <td data-label="Registro ANS">{c.registroANS || '-'}</td>
                    {isAdmin && (
                      <td data-label="Ações">
                        <div className={styles.actions}>
                          <button className={styles.actionBtn} onClick={() => editar(c)} title="Editar convênio">
                            <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={() => { if (confirm('Excluir convênio?')) excluirMutation.mutate(c.id); }}
                            title="Excluir convênio"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.footer}>
              <span className={styles.pageInfo}>
                Mostrando {convenios.length} de {total} convênio{total === 1 ? '' : 's'}
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
