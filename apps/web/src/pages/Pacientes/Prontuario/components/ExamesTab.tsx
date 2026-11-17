import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlusSignIcon,
  Delete02Icon,
  TaskDone01Icon,
  Search01Icon,
  FileImportIcon,
  PencilEdit01Icon,
  PrinterIcon,
} from '@hugeicons/core-free-icons';
import {
  listarExamesBase,
  listarSolicitacoesPaciente,
  solicitarExamePaciente,
  lancarExameExternoPaciente,
  registrarResultadoExame,
  excluirSolicitacaoExame,
} from '@/services/exames';
import { getPacientePorId } from '@/services/pacientes';
import { getClinica } from '@/services/clinica';
import { escapeHtml, printDocument, renderTimbrado } from '@/utils/print';
import { avaliarResultadoExame } from '@/utils/nutricaoCalculos';
import styles from '../ProntuarioPage.module.scss';

interface ExamesTabProps {
  pacienteId: string;
}

type TabExame = 'base' | 'meus';

function normalizeText(str: string): string {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function ExamesTab({ pacienteId }: ExamesTabProps) {
  const [solicitando, setSolicitando] = useState(false);
  const [tabExame, setTabExame] = useState<TabExame>('base');
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [resultadoForm, setResultadoForm] = useState<{
    itemId: string;
    exameNome?: string;
    resultado: string;
    dataResultado: string;
  } | null>(null);
  // Lançamento de exames externos (trazidos pelo paciente, sem solicitação prévia)
  const [lancandoExterno, setLancandoExterno] = useState(false);
  const [externoData, setExternoData] = useState(() => new Date().toISOString().split('T')[0]);
  const [externoBusca, setExternoBusca] = useState('');
  const [externoItens, setExternoItens] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ['exames-solicitacoes', pacienteId],
    queryFn: () => listarSolicitacoesPaciente(pacienteId),
  });

  const { data: paciente } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => getPacientePorId(pacienteId),
  });

  const { data: clinica } = useQuery({
    queryKey: ['clinica'],
    queryFn: getClinica,
    staleTime: 5 * 60 * 1000,
  });

  const { data: examesBase = [] } = useQuery<any[]>({
    queryKey: ['exames-base', 'base'],
    queryFn: () => listarExamesBase('base'),
  });

  const { data: meusExames = [] } = useQuery<any[]>({
    queryKey: ['exames-base', 'custom'],
    queryFn: () => listarExamesBase('custom'),
  });

  const listaAtual = tabExame === 'base' ? examesBase : meusExames;

  const examesFiltrados = useMemo(() => {
    if (!busca.trim()) return listaAtual;
    const termo = normalizeText(busca.trim());
    return listaAtual.filter(
      (ex: any) =>
        normalizeText(ex.nome).includes(termo) ||
        normalizeText(ex.codigo).includes(termo),
    );
  }, [listaAtual, busca]);

  const solicitarMutation = useMutation({
    mutationFn: () => solicitarExamePaciente(pacienteId, selecionados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exames-solicitacoes', pacienteId] });
      setSolicitando(false);
      setSelecionados([]);
      setBusca('');
    },
  });

  const resultadoMutation = useMutation({
    mutationFn: (data: { itemId: string; dataResultado: string; resultado: string }) =>
      registrarResultadoExame({
        itemId: data.itemId,
        dataResultado: data.dataResultado,
        resultado: data.resultado,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exames-solicitacoes', pacienteId] });
      setResultadoForm(null);
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => excluirSolicitacaoExame(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exames-solicitacoes', pacienteId] });
    },
  });

  function toggleExame(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  const todosExames = useMemo(() => [...examesBase, ...meusExames], [examesBase, meusExames]);
  const exameMap = useMemo(() => new Map(todosExames.map((ex: any) => [ex.id, ex])), [todosExames]);

  const externoFiltrados = useMemo(() => {
    const termo = externoBusca.trim().toLowerCase();
    if (!termo) return [];
    return todosExames
      .filter(
        (ex: any) =>
          !(ex.id in externoItens) &&
          (ex.nome.toLowerCase().includes(termo) || ex.codigo.toLowerCase().includes(termo)),
      )
      .slice(0, 12);
  }, [todosExames, externoBusca, externoItens]);

  const externoIds = Object.keys(externoItens);
  const externoValido =
    !!externoData && externoIds.length > 0 && externoIds.every((id) => externoItens[id].trim());

  function fecharExterno() {
    setLancandoExterno(false);
    setExternoItens({});
    setExternoBusca('');
    setExternoData(new Date().toISOString().split('T')[0]);
  }

  const externoMutation = useMutation({
    mutationFn: () =>
      lancarExameExternoPaciente(pacienteId, {
        dataResultado: externoData,
        itens: externoIds.map((id) => ({ exameBaseId: id, resultado: externoItens[id].trim() })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exames-solicitacoes', pacienteId] });
      fecharExterno();
    },
  });

  /** Exame externo: lançado já com resultado na mesma data da "solicitação". */
  function isExterno(sol: any) {
    return (
      sol.itens.length > 0 &&
      sol.itens.every(
        (i: any) => i.resultado && i.dataResultado && new Date(i.dataResultado).getTime() === new Date(sol.dataSolicitada).getTime(),
      )
    );
  }

  function formatRef(ex: any) {
    if (!ex) return '';
    if (ex.valorMinimo == null && ex.valorMaximo == null) return ex.unidade || '';
    const faixa = `${ex.valorMinimo ?? '…'} – ${ex.valorMaximo ?? '…'}`;
    return `Ref.: ${faixa}${ex.unidade ? ` ${ex.unidade}` : ''}`;
  }

  function renderStatusBadge(item: any) {
    if (!item.resultado || !item.exameBase) return null;
    const status = avaliarResultadoExame(
      item.resultado,
      item.exameBase.valorMinimo,
      item.exameBase.valorMaximo,
    );
    if (status === 'NORMAL') {
      return <span className={styles.exameStatusNormal}>Normal</span>;
    }
    if (status === 'ABAIXO') {
      return <span className={styles.exameStatusAbaixo}>Abaixo da ref.</span>;
    }
    if (status === 'ACIMA') {
      return <span className={styles.exameStatusAcima}>Acima da ref.</span>;
    }
    return null;
  }

  function imprimirSolicitacao(sol: any) {
    const dataStr = new Date(sol.dataSolicitada).toLocaleDateString('pt-BR');
    const listaHtml = sol.itens
      .map(
        (item: any) =>
          `<li><strong>${escapeHtml(item.exameBase.nome)}</strong> ${item.exameBase.codigo ? `<small>(${escapeHtml(item.exameBase.codigo)})</small>` : ''
          }</li>`,
      )
      .join('');

    const body = `
      ${renderTimbrado(clinica)}
      <h1>Solicitação de Exames Laboratoriais</h1>
      <div class="paciente">
        <div><span>Paciente</span><strong>${escapeHtml(paciente?.nome || 'Paciente')}</strong></div>
        <div><span>Data da Solicitação</span><strong>${dataStr}</strong></div>
      </div>
      <p class="intro">Solicito a realização dos seguintes exames laboratoriais para avaliação nutricional:</p>
      <ul class="exames-list">${listaHtml}</ul>
      <footer>
        <div class="assinatura">
          <div class="linha"></div>
          <span>Nutricionista responsável</span>
        </div>
        <div class="emissao">Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
      </footer>
    `;

    const css = `
      h1 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #111827; }
      .paciente { display: flex; gap: 28px; padding: 10px 12px; background: #f0fdf4; border: 1px solid #d1fae5; border-radius: 6px; margin-bottom: 18px; }
      .paciente div { display: flex; flex-direction: column; }
      .paciente span { font-size: 10px; text-transform: uppercase; color: #6b7280; }
      .paciente strong { font-size: 13px; }
      .intro { font-size: 13px; color: #374151; margin-bottom: 12px; }
      .exames-list { padding-left: 20px; font-size: 13px; line-height: 1.9; color: #111827; }
      .exames-list small { color: #6b7280; }
      footer { margin-top: 72px; display: flex; justify-content: space-between; align-items: flex-end; }
      .assinatura { text-align: center; }
      .assinatura .linha { width: 260px; border-top: 1px solid #374151; margin-bottom: 4px; }
      .assinatura span, .emissao { font-size: 11px; color: #4b5563; }
    `;

    printDocument({ title: `Solicitação de Exames - ${paciente?.nome || 'Paciente'}`, body, css });
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <button
          className={styles.novaEvolucaoBtn}
          onClick={() => { setSolicitando(!solicitando); setLancandoExterno(false); }}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} /> Solicitar Exame
        </button>
        <button
          className={styles.outlineBtn}
          onClick={() => { if (lancandoExterno) fecharExterno(); else { setLancandoExterno(true); setSolicitando(false); } }}
          title="Lançar resultado de exame trazido pelo paciente, sem solicitação prévia"
        >
          <HugeiconsIcon icon={FileImportIcon} size={16} strokeWidth={2} /> Lançar Exame Externo
        </button>
      </div>

      {lancandoExterno && (
        <div className={styles.evolucaoForm}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
            Lançar Exame Externo
          </h4>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Data do Resultado *</label>
              <input type="date" value={externoData} onChange={(e) => setExternoData(e.target.value)} />
            </div>
            <div className={styles.field} style={{ position: 'relative' }}>
              <label>Adicionar exame</label>
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={externoBusca}
                onChange={(e) => setExternoBusca(e.target.value)}
              />
              {externoFiltrados.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4,
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)', maxHeight: 240, overflowY: 'auto',
                }}>
                  {externoFiltrados.map((ex: any) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => { setExternoItens((prev) => ({ ...prev, [ex.id]: '' })); setExternoBusca(''); }}
                      style={{
                        display: 'flex', justifyContent: 'space-between', width: '100%', gap: '0.5rem',
                        padding: '0.5rem 0.75rem', fontSize: '0.8125rem', textAlign: 'left',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <span>{ex.nome}</span>
                      <span style={{ color: '#9ca3af', fontSize: '0.6875rem' }}>{ex.codigo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {externoIds.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.8125rem', textAlign: 'center', padding: '1rem 0' }}>
              Busque e adicione os exames trazidos pelo paciente.
            </p>
          ) : (
            <table className={styles.externoTable}>
              <thead>
                <tr>
                  <th>Exame</th>
                  <th style={{ width: '40%' }}>Resultado *</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {externoIds.map((id) => {
                  const ex: any = exameMap.get(id);
                  return (
                    <tr key={id}>
                      <td>
                        {ex?.nome}
                        {ex && formatRef(ex) && <div className={styles.externoRef}>{formatRef(ex)}</div>}
                      </td>
                      <td>
                        <input
                          value={externoItens[id]}
                          placeholder={ex?.unidade ? `Valor (${ex.unidade})` : 'Valor do resultado'}
                          onChange={(e) => setExternoItens((prev) => ({ ...prev, [id]: e.target.value }))}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.medidaActionBtn}
                          title="Remover"
                          onClick={() =>
                            setExternoItens((prev) => {
                              const { [id]: _removido, ...resto } = prev;
                              return resto;
                            })
                          }
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {externoMutation.isError && (
            <p style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              {(externoMutation.error as any)?.response?.data?.message || 'Erro ao lançar exames'}
            </p>
          )}

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={fecharExterno}>
              Cancelar
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              disabled={!externoValido || externoMutation.isPending}
              onClick={() => externoMutation.mutate()}
            >
              {externoMutation.isPending ? 'Salvando...' : `Lançar (${externoIds.length})`}
            </button>
          </div>
        </div>
      )}

      {solicitando && (
        <div className={styles.evolucaoForm}>
          {/* Tabs dentro do form de solicitação */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e5e7eb', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => { setTabExame('base'); setBusca(''); }}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: tabExame === 'base' ? '#10b981' : '#9ca3af',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tabExame === 'base' ? '#10b981' : 'transparent'}`,
                marginBottom: '-2px',
                cursor: 'pointer',
              }}
            >
              Exames Base ({examesBase.length})
            </button>
            <button
              type="button"
              onClick={() => { setTabExame('meus'); setBusca(''); }}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: tabExame === 'meus' ? '#10b981' : '#9ca3af',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tabExame === 'meus' ? '#10b981' : 'transparent'}`,
                marginBottom: '-2px',
                cursor: 'pointer',
              }}
            >
              Meus Exames ({meusExames.length})
            </button>
          </div>

          {/* Busca */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
              <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={2} />
            </span>
            <input
              type="text"
              placeholder="Filtrar exames..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Lista de exames com checkboxes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '0.375rem',
            marginBottom: '1rem',
            maxHeight: '280px',
            overflowY: 'auto',
          }}>
            {examesFiltrados.map((ex: any) => (
              <label key={ex.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                padding: '0.25rem 0.375rem',
                borderRadius: '0.375rem',
                background: selecionados.includes(ex.id) ? '#f0fdf4' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <input
                  type="checkbox"
                  checked={selecionados.includes(ex.id)}
                  onChange={() => toggleExame(ex.id)}
                  style={{ accentColor: '#10b981' }}
                />
                <span style={{ flex: 1 }}>{ex.nome}</span>
                {ex.unidade && (
                  <span style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>{ex.unidade}</span>
                )}
              </label>
            ))}
          </div>

          {examesFiltrados.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: '0.8125rem', textAlign: 'center', padding: '1rem 0' }}>
              {busca.trim()
                ? 'Nenhum exame encontrado.'
                : tabExame === 'meus'
                  ? 'Nenhum exame personalizado cadastrado. Cadastre em Exames > Meus Exames.'
                  : 'Nenhum exame base disponível.'}
            </p>
          )}

          {selecionados.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginBottom: '0.5rem' }}>
              {selecionados.length} exame{selecionados.length !== 1 ? 's' : ''} selecionado{selecionados.length !== 1 ? 's' : ''}
            </p>
          )}

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => { setSolicitando(false); setSelecionados([]); setBusca(''); }}>
              Cancelar
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              disabled={selecionados.length === 0 || solicitarMutation.isPending}
              onClick={() => solicitarMutation.mutate()}
            >
              {solicitarMutation.isPending ? 'Solicitando...' : `Solicitar (${selecionados.length})`}
            </button>
          </div>
        </div>
      )}

      {resultadoForm && (
        <div className={styles.evolucaoForm}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
            {resultadoForm.exameNome ? `Resultado — ${resultadoForm.exameNome}` : 'Registrar Resultado'}
          </h4>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Data do Resultado</label>
              <input
                type="date"
                value={resultadoForm.dataResultado}
                onChange={(e) => setResultadoForm({ ...resultadoForm, dataResultado: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Resultado</label>
              <input
                value={resultadoForm.resultado}
                onChange={(e) => setResultadoForm({ ...resultadoForm, resultado: e.target.value })}
                placeholder="Valor do resultado"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setResultadoForm(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              disabled={!resultadoForm.resultado || resultadoMutation.isPending}
              onClick={() => resultadoMutation.mutate(resultadoForm)}
            >
              {resultadoMutation.isPending ? 'Salvando...' : 'Salvar Resultado'}
            </button>
          </div>
        </div>
      )}

      {solicitacoes.length === 0 ? (
        <div className={styles.empty}>Nenhum exame solicitado.</div>
      ) : (
        solicitacoes.map((sol: any) => (
          <div key={sol.id} className={styles.evolucaoCard}>
            <div className={styles.evolucaoHeader}>
              <h3>
                {isExterno(sol) ? 'Exame externo' : 'Solicitação'} —{' '}
                {new Date(sol.dataSolicitada).toLocaleDateString('pt-BR', isExterno(sol) ? { timeZone: 'UTC' } : undefined)}
                {isExterno(sol) && <span className={styles.externoBadge}>Externo</span>}
              </h3>
              <div className={styles.medidaActionsCell}>
                <button
                  type="button"
                  className={styles.medidaEditBtn}
                  title="Imprimir pedido de exames em papel timbrado"
                  onClick={() => imprimirSolicitacao(sol)}
                >
                  <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className={styles.medidaActionBtn}
                  title="Excluir solicitação"
                  onClick={() => {
                    if (confirm('Excluir esta solicitação?')) excluirMutation.mutate(sol.id);
                  }}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className={styles.medidasTable}>
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Exame</th>
                    <th>Referência</th>
                    <th>Resultado</th>
                    <th>Data Resultado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sol.itens.map((item: any) => (
                    <tr key={item.id}>
                      <td>{item.exameBase.codigo}</td>
                      <td>{item.exameBase.nome}</td>
                      <td>
                        <span className={styles.externoRef}>{formatRef(item.exameBase) || '-'}</span>
                      </td>
                      <td>
                        <div className={styles.exameResultadoCell}>
                          <strong>{item.resultado || '-'}</strong>
                          {item.resultado && item.exameBase?.unidade && (
                            <span className={styles.externoRef}>{item.exameBase.unidade}</span>
                          )}
                          {renderStatusBadge(item)}
                        </div>
                      </td>
                      <td>
                        {item.dataResultado
                          ? new Date(item.dataResultado).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                          : '-'}
                      </td>
                      <td>
                        <button
                          className={item.resultado ? styles.medidaEditBtn : styles.medidaActionBtn}
                          style={!item.resultado ? { color: '#10b981' } : undefined}
                          title={item.resultado ? 'Editar resultado' : 'Registrar resultado'}
                          onClick={() =>
                            setResultadoForm({
                              itemId: item.id,
                              exameNome: item.exameBase.nome,
                              resultado: item.resultado || '',
                              dataResultado: item.dataResultado
                                ? new Date(item.dataResultado).toISOString().split('T')[0]
                                : new Date().toISOString().split('T')[0],
                            })
                          }
                        >
                          <HugeiconsIcon
                            icon={item.resultado ? PencilEdit01Icon : TaskDone01Icon}
                            size={16}
                            strokeWidth={2}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards para Mobile */}
            <div className={styles.mobileCards} style={{ marginTop: '0.75rem' }}>
              {sol.itens.map((item: any) => (
                <div key={item.id} className={styles.mobileCard} style={{ padding: '0.75rem', gap: '0.5rem' }}>
                  <div className={styles.cardHeader} style={{ paddingBottom: '0.25rem' }}>
                    <strong>{item.exameBase.nome}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.exameBase.codigo}</span>
                  </div>
                  <div className={styles.cardBodyGrid} style={{ gap: '0.5rem' }}>
                    <div className={styles.cardInfoGridItem}>
                      <span className={styles.cardInfoLabel}>Resultado</span>
                      <div className={styles.exameResultadoCell}>
                        <span className={styles.cardInfoValue}>{item.resultado || '-'}</span>
                        {renderStatusBadge(item)}
                      </div>
                      {formatRef(item.exameBase) && (
                        <span className={styles.externoRef}>{formatRef(item.exameBase)}</span>
                      )}
                    </div>
                    <div className={styles.cardInfoGridItem}>
                      <span className={styles.cardInfoLabel}>Data Resultado</span>
                      <span className={styles.cardInfoValue}>
                        {item.dataResultado
                          ? new Date(item.dataResultado).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.cardActions} style={{ padding: '0', marginTop: '0.25rem', paddingTop: '0.5rem', border: 'none' }}>
                    <button
                      className={styles.actionBtn}
                      style={{ color: '#10b981', display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600, width: '100%' }}
                      onClick={() =>
                        setResultadoForm({
                          itemId: item.id,
                          exameNome: item.exameBase.nome,
                          resultado: item.resultado || '',
                          dataResultado: item.dataResultado
                            ? new Date(item.dataResultado).toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0],
                        })
                      }
                    >
                      <HugeiconsIcon
                        icon={item.resultado ? PencilEdit01Icon : TaskDone01Icon}
                        size={14}
                        strokeWidth={2}
                      />
                      {item.resultado ? 'Editar Resultado' : 'Registrar Resultado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
