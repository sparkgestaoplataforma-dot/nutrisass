import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Delete02Icon, PrinterIcon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { listarMedidas, criarMedida, editarMedida, excluirMedida } from '@/services/prontuario';
import { getPacientePorId } from '@/services/pacientes';
import { getClinica } from '@/services/clinica';
import type { CreateMedidaInput } from '@nutricao/shared';
import {
  calcularIMC,
  classificarIMC,
  calcularFaixaPesoIdeal,
  calcularRCQ,
  calcularRCE,
} from '@/utils/nutricaoCalculos';
import { imprimirMedidas } from '../print/imprimirMedidas';
import styles from '../ProntuarioPage.module.scss';

function calcularIdadeAnos(dataNascimento?: string | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

interface MedidasTabProps {
  pacienteId: string;
}

const medidaFields = [
  { key: 'peso', label: 'Peso (kg)' },
  { key: 'altura', label: 'Altura (cm)' },
  { key: 'cintura', label: 'Cintura' },
  { key: 'abdomen', label: 'Abdômen' },
  { key: 'quadril', label: 'Quadril' },
  { key: 'bracoDireito', label: 'Braço Dir.' },
  { key: 'bracoEsquerdo', label: 'Braço Esq.' },
  { key: 'coxaDireita', label: 'Coxa Dir.' },
  { key: 'coxaEsquerda', label: 'Coxa Esq.' },
  { key: 'culote', label: 'Culote' },
] as const;

export function MedidasTab({ pacienteId }: MedidasTabProps) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: medidas = [] } = useQuery({
    queryKey: ['medidas', pacienteId],
    queryFn: () => listarMedidas(pacienteId),
  });

  // Mesma chave usada no ProntuarioPage (reaproveita o cache)
  const { data: paciente } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => getPacientePorId(pacienteId),
  });

  const { data: clinica } = useQuery({
    queryKey: ['clinica'],
    queryFn: getClinica,
    staleTime: 5 * 60 * 1000,
  });

  const { register, handleSubmit, reset } = useForm<CreateMedidaInput>();

  const salvarMutation = useMutation({
    mutationFn: async (data: CreateMedidaInput) => {
      const payload: any = { ...data, pacienteId };
      for (const f of medidaFields) {
        if (payload[f.key] !== undefined && payload[f.key] !== '' && payload[f.key] !== null) {
          payload[f.key] = Number(payload[f.key]);
        } else {
          delete payload[f.key];
        }
      }
      if (editandoId) {
        return editarMedida(editandoId, payload);
      }
      return criarMedida(pacienteId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medidas', pacienteId] });
      setFormAberto(false);
      setEditandoId(null);
      reset();
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => excluirMedida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medidas', pacienteId] });
    },
  });

  function iniciarNovaMedida() {
    setEditandoId(null);
    const ultimaAltura = medidasOrdenadas[medidasOrdenadas.length - 1]?.altura;
    reset({
      data: new Date().toISOString().split('T')[0],
      altura: ultimaAltura ?? undefined,
    } as any);
    setFormAberto(true);
  }

  function iniciarEdicao(medida: any) {
    setEditandoId(medida.id);
    const valores: any = {
      data: medida.data ? new Date(medida.data).toISOString().split('T')[0] : '',
    };
    for (const f of medidaFields) {
      valores[f.key] = medida[f.key] ?? '';
    }
    reset(valores);
    setFormAberto(true);
  }

  const medidasOrdenadas = useMemo(
    () => [...medidas].sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime()),
    [medidas],
  );

  const resumoAntropometrico = useMemo(() => {
    if (medidasOrdenadas.length === 0) return null;
    const ultima = medidasOrdenadas[medidasOrdenadas.length - 1];
    const anterior = medidasOrdenadas.length > 1 ? medidasOrdenadas[medidasOrdenadas.length - 2] : null;
    const idade = calcularIdadeAnos(paciente?.dataNascimento);

    const imcRaw = calcularIMC(ultima.peso, ultima.altura);
    const imc = imcRaw !== null ? Math.round(imcRaw * 10) / 10 : null;
    const imcClassificacao = imc !== null ? classificarIMC(imc, idade) : null;
    const imcReferencia = idade !== null && idade >= 60 ? 'Lipschitz (Idoso ≥ 60a)' : 'OMS (Adulto)';
    const faixaPeso = calcularFaixaPesoIdeal(ultima.altura, idade);
    const pesoAlvoMedio = faixaPeso ? Math.round(((faixaPeso.min + faixaPeso.max) / 2) * 10) / 10 : null;
    const rcq = calcularRCQ(ultima.cintura, ultima.quadril, paciente?.sexo);
    const rce = calcularRCE(ultima.cintura, ultima.altura);

    const diffPeso =
      anterior && typeof ultima.peso === 'number' && typeof anterior.peso === 'number'
        ? +(ultima.peso - anterior.peso).toFixed(1)
        : null;

    return {
      ultima,
      idade,
      imc,
      imcClassificacao,
      imcReferencia,
      faixaPeso,
      pesoAlvoMedio,
      rcq,
      rce,
      diffPeso,
    };
  }, [medidasOrdenadas, paciente]);

  return (
    <div>
      <div className={styles.toolbar}>
        <button
          className={styles.novaMedidaBtn}
          onClick={() => {
            if (formAberto && !editandoId) {
              setFormAberto(false);
            } else {
              iniciarNovaMedida();
            }
          }}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} /> Adicionar Medida
        </button>
        <button
          className={styles.outlineBtn}
          disabled={medidas.length === 0 || !paciente}
          title={medidas.length === 0 ? 'Nenhuma medida para imprimir' : 'Imprimir medidas em papel timbrado'}
          onClick={() => paciente && imprimirMedidas(medidas, paciente, clinica)}
        >
          <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2} /> Imprimir
        </button>
      </div>

      {/* Cards de Diagnóstico Antropométrico Automático */}
      {resumoAntropometrico && (
        <div className={styles.antropoSummaryGrid}>
          <div className={styles.antropoCard}>
            <span className={styles.antropoCardLabel}>Peso Atual</span>
            <div className={styles.antropoCardValue}>
              {resumoAntropometrico.ultima.peso ?? '-'}
              <small>kg</small>
            </div>
            {resumoAntropometrico.diffPeso !== null ? (
              <span
                className={
                  resumoAntropometrico.diffPeso <= 0 ? styles.antropoBadgeOk : styles.antropoBadgeWarn
                }
              >
                {resumoAntropometrico.diffPeso > 0 ? '+' : ''}
                {resumoAntropometrico.diffPeso} kg vs. anterior
              </span>
            ) : (
              <span className={styles.antropoCardSub}>
                Altura: {resumoAntropometrico.ultima.altura ? `${resumoAntropometrico.ultima.altura} cm` : '-'}
              </span>
            )}
          </div>

          <div className={styles.antropoCard}>
            <span className={styles.antropoCardLabel}>IMC Atual</span>
            <div className={styles.antropoCardValue}>
              {resumoAntropometrico.imc ?? '-'}
              {resumoAntropometrico.imc !== null && <small>kg/m²</small>}
            </div>
            {resumoAntropometrico.imcClassificacao ? (
              <>
                <span
                  className={
                    resumoAntropometrico.imcClassificacao.startsWith('Peso adequado')
                      ? styles.antropoBadgeOk
                      : styles.antropoBadgeWarn
                  }
                >
                  {resumoAntropometrico.imcClassificacao}
                </span>
                <span className={styles.antropoCardSub}>
                  Critério: {resumoAntropometrico.imcReferencia}
                </span>
              </>
            ) : (
              <span className={styles.antropoCardSub}>Informe peso e altura</span>
            )}
          </div>

          <div className={styles.antropoCard}>
            <span className={styles.antropoCardLabel}>Faixa de Peso Ideal</span>
            <div className={styles.antropoCardValue}>
              {resumoAntropometrico.faixaPeso
                ? `${resumoAntropometrico.faixaPeso.min} – ${resumoAntropometrico.faixaPeso.max}`
                : '-'}
              {resumoAntropometrico.faixaPeso && <small>kg</small>}
            </div>
            {resumoAntropometrico.pesoAlvoMedio !== null && (
              <span className={styles.antropoCardSub}>
                Alvo médio: <strong>{resumoAntropometrico.pesoAlvoMedio} kg</strong>
              </span>
            )}
          </div>

          <div className={styles.antropoCard}>
            <span className={styles.antropoCardLabel}>RCQ (Cintura/Quadril)</span>
            <div className={styles.antropoCardValue}>
              {resumoAntropometrico.rcq ? resumoAntropometrico.rcq.valor : '-'}
            </div>
            {resumoAntropometrico.rcq ? (
              <span
                className={
                  resumoAntropometrico.rcq.risco === 'Baixo'
                    ? styles.antropoBadgeOk
                    : resumoAntropometrico.rcq.risco === 'Moderado'
                      ? styles.antropoBadgeWarn
                      : styles.antropoBadgeDanger
                }
              >
                Risco {resumoAntropometrico.rcq.risco}
              </span>
            ) : (
              <span className={styles.antropoCardSub}>Informe cintura e quadril</span>
            )}
          </div>

          <div className={styles.antropoCard}>
            <span className={styles.antropoCardLabel}>RCE (Cintura/Estatura)</span>
            <div className={styles.antropoCardValue}>
              {resumoAntropometrico.rce ? resumoAntropometrico.rce.valor : '-'}
            </div>
            {resumoAntropometrico.rce ? (
              <span
                className={
                  resumoAntropometrico.rce.risco === 'Adequado'
                    ? styles.antropoBadgeOk
                    : styles.antropoBadgeDanger
                }
              >
                {resumoAntropometrico.rce.risco}
              </span>
            ) : (
              <span className={styles.antropoCardSub}>Meta saludable: &lt; 0,50</span>
            )}
          </div>
        </div>
      )}

      {formAberto && (
        <form
          className={styles.evolucaoForm}
          onSubmit={handleSubmit((data) => salvarMutation.mutate(data))}
        >
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 700 }}>
            {editandoId ? 'Editar Avaliação Antropométrica' : 'Nova Avaliação Antropométrica'}
          </h4>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Data da Avaliação *</label>
              <input type="date" {...register('data')} />
            </div>
            {medidaFields.map((f) => (
              <div key={f.key} className={styles.field}>
                <label>{f.label}</label>
                <input
                  type="number"
                  step="0.1"
                  {...register(f.key as any)}
                  placeholder="0.0"
                />
              </div>
            ))}
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setFormAberto(false);
                setEditandoId(null);
                reset();
              }}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={salvarMutation.isPending}>
              {salvarMutation.isPending ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {medidas.length === 0 ? (
        <div className={styles.empty}>Nenhuma medida registrada.</div>
      ) : (
        <>
          {/* Tabela para Desktop */}
          <div className={styles.medidasTable}>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  {medidaFields.map((f) => (
                    <th key={f.key}>{f.label}</th>
                  ))}
                  <th>IMC</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {medidas.map((m: any) => {
                  const imcLinha = calcularIMC(m.peso, m.altura);
                  return (
                    <tr key={m.id}>
                      <td>{new Date(m.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                      {medidaFields.map((f) => (
                        <td key={f.key}>{m[f.key] ?? '-'}</td>
                      ))}
                      <td>
                        <strong>{imcLinha ?? '-'}</strong>
                      </td>
                      <td>
                        <div className={styles.medidaActionsCell}>
                          <button
                            type="button"
                            className={styles.medidaEditBtn}
                            title="Editar medida"
                            onClick={() => iniciarEdicao(m)}
                          >
                            <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className={styles.medidaActionBtn}
                            title="Excluir medida"
                            onClick={() => {
                              if (confirm('Excluir esta medida?')) {
                                excluirMutation.mutate(m.id);
                              }
                            }}
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards para Mobile */}
          <div className={styles.mobileCards}>
            {medidas.map((m: any) => {
              const imcCard = calcularIMC(m.peso, m.altura);
              return (
                <div key={m.id} className={styles.mobileCard}>
                  <div className={styles.cardHeader}>
                    <strong>{new Date(m.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</strong>
                    <div className={styles.medidaActionsCell}>
                      <button
                        type="button"
                        className={styles.medidaEditBtn}
                        title="Editar medida"
                        onClick={() => iniciarEdicao(m)}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className={styles.medidaActionBtn}
                        title="Excluir medida"
                        onClick={() => {
                          if (confirm('Excluir esta medida?')) {
                            excluirMutation.mutate(m.id);
                          }
                        }}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.cardBodyGrid}>
                    {medidaFields.map((f) => (
                      <div key={f.key} className={styles.cardInfoGridItem}>
                        <span className={styles.cardInfoLabel}>{f.label}</span>
                        <span className={styles.cardInfoValue}>{m[f.key] ?? '-'}</span>
                      </div>
                    ))}
                    <div className={styles.cardInfoGridItem}>
                      <span className={styles.cardInfoLabel}>IMC (kg/m²)</span>
                      <span className={styles.cardInfoValue}>{imcCard ?? '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
