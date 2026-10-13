import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AppleIcon,
  PlusSignIcon,
  PencilEdit01Icon,
  Delete02Icon,
  Search01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { api } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './AlimentosPage.module.scss';

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

type Tab = 'taco' | 'meus';

interface Alimento {
  id: string;
  nome: string;
  grupo?: string;
  calorias?: number;
  proteinas?: number;
  carboidratos?: number;
  gorduras?: number;
  fibra?: number;
  medidasCaseiras?: { id?: string; nome: string; quantidadeEmGramas: number }[];
}

interface AlimentosResponse {
  data: Alimento[];
  total: number;
  page: number;
  totalPages: number;
}

export function AlimentosPage() {
  const [tab, setTab] = useState<Tab>('taco');
  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebounce(busca, 500);
  const [page, setPage] = useState(1);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AlimentosResponse>({
    queryKey: ['alimentos-page', tab, page, buscaDebounced],
    queryFn: async () => {
      const tipo = tab === 'taco' ? 'taco' : 'custom';
      const { data } = await api.get(`/alimentos?tipo=${tipo}&page=${page}&limit=20&q=${buscaDebounced}`);
      return data;
    },
  });

  const { register, handleSubmit, reset, control } = useForm<any>();

  const { fields: medidasFields, append: appendMedida, remove: removeMedida } = useFieldArray({
    control,
    name: 'medidasCaseiras',
  });

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        ...formData,
        calorias: formData.calorias ? Number(formData.calorias) : undefined,
        proteinas: formData.proteinas ? Number(formData.proteinas) : undefined,
        carboidratos: formData.carboidratos ? Number(formData.carboidratos) : undefined,
        gorduras: formData.gorduras ? Number(formData.gorduras) : undefined,
        fibra: formData.fibra ? Number(formData.fibra) : undefined,
        medidasCaseiras: formData.medidasCaseiras?.map((m: any) => ({
          nome: m.nome,
          quantidadeEmGramas: Number(m.quantidadeEmGramas),
        })) || [],
      };
      if (editandoId) return api.put(`/alimentos/${editandoId}`, payload);
      return api.post('/alimentos', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alimentos-page'] });
      fecharForm();
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/alimentos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alimentos-page'] });
    },
  });

  const alimentos = data?.data || [];
  const isMeus = tab === 'meus';

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setBusca('');
    setPage(1);
    fecharForm();
  }

  function handleBuscaChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBusca(e.target.value);
    setPage(1);
  }

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
    reset({
      nome: '',
      grupo: '',
      calorias: '',
      proteinas: '',
      carboidratos: '',
      gorduras: '',
      fibra: '',
      medidasCaseiras: []
    });
  }

  function editar(al: Alimento) {
    setEditandoId(al.id);
    reset({
      nome: al.nome,
      grupo: al.grupo || '',
      calorias: al.calorias ?? '',
      proteinas: al.proteinas ?? '',
      carboidratos: al.carboidratos ?? '',
      gorduras: al.gorduras ?? '',
      fibra: al.fibra ?? '',
      medidasCaseiras: al.medidasCaseiras || []
    });
    setFormAberto(true);
  }

  return (
    <div className={styles.page}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'taco' ? styles.active : ''}`}
          onClick={() => handleTabChange('taco')}
        >
          Tabela TACO (Sistema)
        </button>
        <button
          className={`${styles.tab} ${tab === 'meus' ? styles.active : ''}`}
          onClick={() => handleTabChange('meus')}
        >
          Meus Alimentos
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={2} />
          </span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder={isMeus ? 'Buscar nos meus alimentos...' : 'Buscar na Tabela TACO...'}
            value={busca}
            onChange={handleBuscaChange}
          />
        </div>

        {isMeus && (
          <button className={styles.addBtn} onClick={() => { fecharForm(); setFormAberto(true); }}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
            Novo Alimento
          </button>
        )}
      </div>

      {/* Form (Meus Alimentos only) */}
      {isMeus && formAberto && (
        <div className={styles.formCard}>
          <p className={styles.formTitle}>
            {editandoId ? 'Editar Alimento' : 'Novo Alimento Personalizado'}
          </p>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <div className={styles.formGrid}>
              <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <label>Nome do Alimento</label>
                <input {...register('nome', { required: true })} placeholder="Ex: Whey Protein Concentrado" />
              </div>
              <div className={styles.field}>
                <label>Grupo</label>
                <input {...register('grupo')} placeholder="Ex: Suplementos" />
              </div>
              <div className={styles.field}>
                <label>Calorias (kcal)</label>
                <input type="number" step="0.01" {...register('calorias')} placeholder="0.00" />
              </div>
              <div className={styles.field}>
                <label>Proteínas (g)</label>
                <input type="number" step="0.01" {...register('proteinas')} placeholder="0.00" />
              </div>
              <div className={styles.field}>
                <label>Carboidratos (g)</label>
                <input type="number" step="0.01" {...register('carboidratos')} placeholder="0.00" />
              </div>
              <div className={styles.field}>
                <label>Gorduras (g)</label>
                <input type="number" step="0.01" {...register('gorduras')} placeholder="0.00" />
              </div>
              <div className={styles.field}>
                <label>Fibras (g)</label>
                <input type="number" step="0.01" {...register('fibra')} placeholder="0.00" />
              </div>
            </div>

            <div className={styles.medidasSection}>
              <div className={styles.medidasHeader}>
                <h4>Medidas e Porções (Opcional)</h4>
                <p>A tabela TACO usa como base 100g (ou 100ml). Configure as medidas caseiras para este alimento.</p>
              </div>

              <div className={styles.medidasBody}>
                {/* Pre-set units section */}
                <div className={styles.quickMeasuresSection}>
                  <label>Adicionar medida rápida:</label>
                  <div className={styles.quickMeasuresGrid}>
                    {UNIDADES_SUGERIDAS.map(unidade => (
                      <button 
                        key={unidade}
                        type="button" 
                        onClick={() => appendMedida({ nome: unidade, quantidadeEmGramas: '' })}
                        className={styles.quickMeasureBtn}
                      >
                        <HugeiconsIcon icon={PlusSignIcon} size={12} strokeWidth={2} />
                        {unidade}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Added measures list */}
                {medidasFields.length > 0 && (
                  <div className={styles.medidasConfiguredList}>
                    <label>Medidas configuradas:</label>
                    
                    <div className={styles.medidasListWrapper}>
                      {medidasFields.map((field, index) => (
                        <div key={field.id} className={styles.medidaRow}>
                          <div className={styles.medidaInputs}>
                            <div className={`${styles.field} ${styles.medidaInputNome}`}>
                              <label>Nome da Medida</label>
                              <input 
                                list="unidades-sugeridas"
                                {...register(`medidasCaseiras.${index}.nome` as const, { required: true })} 
                                placeholder="Ex: colher de sopa, unidade..." 
                              />
                            </div>
                            <div className={`${styles.field} ${styles.medidaInputEquiv}`}>
                              <label>Equiv. (g ou ml)</label>
                              <input 
                                type="number" step="0.01" min="0" 
                                {...register(`medidasCaseiras.${index}.quantidadeEmGramas` as const, { required: true })} 
                                placeholder="Ex: 15" 
                              />
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeMedida(index)} 
                            className={styles.medidaRemoveBtn}
                            title="Remover medida"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add custom blank measure button */}
                <div className={`${styles.addCustomMeasureContainer} ${medidasFields.length > 0 ? styles.hasItems : ''}`}>
                  <button 
                    type="button" 
                    onClick={() => appendMedida({ nome: '', quantidadeEmGramas: '' })} 
                    className={styles.addCustomMeasureBtn}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} />
                    Adicionar medida com outro nome
                  </button>
                </div>
              </div>
              
              <datalist id="unidades-sugeridas">
                {UNIDADES_SUGERIDAS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
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

      {/* Content */}
      {isLoading ? (
        <div className={styles.loading}>Carregando alimentos...</div>
      ) : isMeus && alimentos.length === 0 && !buscaDebounced && !formAberto ? (
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <HugeiconsIcon icon={AppleIcon} size={48} strokeWidth={1.2} />
            </div>
            <h3 className={styles.emptyTitle}>Nenhum alimento personalizado</h3>
            <p className={styles.emptyDesc}>
              Aqui você pode cadastrar alimentos específicos, como suplementos de marcas
              específicas ou receitas próprias da sua clínica que não
              existem na tabela TACO.
            </p>
            <button className={styles.emptyBtn} onClick={() => { fecharForm(); setFormAberto(true); }}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
              Cadastrar Primeiro Alimento
            </button>
          </div>
        </div>
      ) : alimentos.length === 0 ? (
        <div className={styles.tableCard}>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <HugeiconsIcon icon={Search01Icon} size={40} strokeWidth={1.5} />
            </div>
            <p>Nenhum alimento encontrado para "{buscaDebounced}"</p>
          </div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Grupo</th>
                  <th>Kcal</th>
                  <th>Carb (g)</th>
                  <th>Prot (g)</th>
                  <th>Gord (g)</th>
                  {isMeus && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {alimentos.map((al) => (
                  <tr key={al.id}>
                    <td data-label="Nome">{al.nome}</td>
                    <td data-label="Grupo" className={styles.codeCell}>{al.grupo || '-'}</td>
                    <td data-label="Kcal" className={styles.valueCell}>{al.calorias ?? '-'}</td>
                    <td data-label="Carb (g)" className={styles.valueCell}>{al.carboidratos ?? '-'}</td>
                    <td data-label="Prot (g)" className={styles.valueCell}>{al.proteinas ?? '-'}</td>
                    <td data-label="Gord (g)" className={styles.valueCell}>{al.gorduras ?? '-'}</td>
                    {isMeus && (
                      <td data-label="Ações">
                        <div className={styles.actions}>
                          <button className={styles.actionBtn} onClick={() => editar(al)} title="Editar">
                            <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={() => { if (confirm('Excluir alimento?')) excluirMutation.mutate(al.id); }}
                            title="Excluir"
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
          </div>
          
          {/* Pagination Footer */}
          <div className={styles.footer}>
            <span className={styles.pageInfo}>
              Mostrando {alimentos.length} alimentos de {data?.total}
            </span>
            {data && data.totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className={styles.pageBtn} 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                </button>
                <span className={styles.pageInfo}>Página {page} de {data.totalPages}</span>
                <button 
                  className={styles.pageBtn} 
                  disabled={page === data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
