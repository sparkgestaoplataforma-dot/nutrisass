import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { PrinterIcon, ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { buscarPlano } from '@/services/planoAlimentar';
import { useClinicalAccess } from '@/hooks/useClinicalAccess';
import { calcularTotaisPlano } from '@/utils/nutricaoCalculos';
import styles from './PlanoAlimentarPdfPage.module.scss';

function calcularIdade(dataNascimento: string | Date | null | undefined): string {
  if (!dataNascimento) return '--';
  const nasci = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasci.getFullYear();
  const m = hoje.getMonth() - nasci.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasci.getDate())) {
    idade--;
  }
  return `${idade} anos`;
}

function getLogomarcaSrc(logomarca?: string | null): string | null {
  if (!logomarca) return null;
  if (
    logomarca.startsWith('data:') ||
    logomarca.startsWith('http://') ||
    logomarca.startsWith('https://') ||
    logomarca.startsWith('blob:') ||
    logomarca.startsWith('/')
  ) {
    return logomarca;
  }
  return `/api/uploads/${logomarca}`;
}

export function PlanoAlimentarPdfPage() {
  const { pacienteId, id } = useParams<{ pacienteId: string; id: string }>();
  const navigate = useNavigate();
  const hasClinicalAccess = useClinicalAccess();

  // Controles de impressão (permite ocultar calorias do paciente e alternar entre Opção Principal e Média)
  const [exibirCaloriasNoPdf, setExibirCaloriasNoPdf] = useState<boolean>(true);
  const [modoCalculoResumo, setModoCalculoResumo] = useState<'principal' | 'media'>('principal');

  const handleBack = () => {
    window.close();
    if (window.history.length > 1) {
      navigate(-1);
    } else if (pacienteId) {
      navigate(`/pacientes/${pacienteId}`);
    } else {
      navigate('/pacientes');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['plano-alimentar', id],
    queryFn: () => buscarPlano(id!),
    enabled: hasClinicalAccess && !!id,
  });

  const plano = response?.data;

  const totaisResumo = useMemo(() => {
    if (!plano || !plano.refeicoes) {
      return { cal: 0, prot: 0, carb: 0, gord: 0, fibra: 0 };
    }
    return calcularTotaisPlano(plano.refeicoes, modoCalculoResumo);
  }, [plano, modoCalculoResumo]);

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados do plano...</div>;
  }

  if (error || !plano) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Erro ao carregar plano alimentar</h2>
        <button onClick={handleBack} className={styles.backBtn}>
          Voltar
        </button>
      </div>
    );
  }

  const paciente = plano.paciente;
  const clinica = plano.clinica;
  const usuario = plano.usuario;
  const logoSrc = getLogomarcaSrc(clinica?.logomarca);

  return (
    <div className={styles.pdfContainer}>
      <div
        className={`${styles.controls} ${styles.noPrint}`}
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <button className={styles.backBtn} onClick={handleBack}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          Voltar
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={exibirCaloriasNoPdf}
              onChange={(e) => setExibirCaloriasNoPdf(e.target.checked)}
              style={{ accentColor: '#059669', width: 15, height: 15 }}
            />
            Exibir calorias e macros no PDF do paciente
          </label>

          {exibirCaloriasNoPdf && (
            <select
              value={modoCalculoResumo}
              onChange={(e) => setModoCalculoResumo(e.target.value as 'principal' | 'media')}
              style={{
                fontSize: '12px',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#334155',
              }}
            >
              <option value="principal">Cálculo: Opção Principal (Opção 1)</option>
              <option value="media">Cálculo: Média de todas as opções</option>
            </select>
          )}

          <button className={styles.printBtn} onClick={handlePrint}>
            <HugeiconsIcon icon={PrinterIcon} size={18} />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      <header className={styles.header}>
        <div className={styles.clinicInfo}>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={clinica?.nome || 'Logo da clínica'}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={{ width: 50, height: 50, background: '#e5e7eb', borderRadius: 8 }} />
          )}
          <h1>{clinica?.nome || 'NutriSaaS'}</h1>
        </div>
        <div className={styles.docTitle}>
          <h2>Plano Alimentar</h2>
          <p>{plano.titulo}</p>
          <p>Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </header>

      <section className={styles.patientSection}>
        <div className={styles.infoGroup}>
          <label>Paciente</label>
          <span>{paciente?.nome || 'Não informado'}</span>
        </div>
        <div className={styles.infoGroup}>
          <label>Idade</label>
          <span>{calcularIdade(paciente?.dataNascimento)}</span>
        </div>
        <div className={styles.infoGroup}>
          <label>Objetivo</label>
          <span>{plano.objetivo || 'Não especificado'}</span>
        </div>
        {plano.recomendacaoAguaMl && (
          <div className={styles.infoGroup}>
            <label>Recomendação de Água</label>
            <span>{plano.recomendacaoAguaMl} ml/dia</span>
          </div>
        )}
      </section>

      <div className={styles.content}>
        {(plano.refeicoes || []).map((ref) => (
          <div key={ref.id} className={styles.refeicao}>
            <div className={styles.refeicaoHeader}>
              <h3>{ref.nome}</h3>
              <span>{ref.horario}</span>
            </div>

            <div className={styles.opcoes}>
              {(ref.opcoes || []).map((opc, idx) => (
                <div key={opc.id} className={styles.opcaoWrapper}>
                  <div className={styles.opcao}>
                    {ref.opcoes.length > 1 && (
                      <h4 className={styles.opcaoTitle}>{opc.nome || `Opção ${idx + 1}`}</h4>
                    )}

                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.colQtde}>Qtde</th>
                          <th className={styles.colMedida}>Medida</th>
                          <th className={styles.colAlimento}>Alimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(opc.alimentos || []).map((al) => (
                          <tr key={al.id}>
                            <td>{al.quantidade}</td>
                            <td>{al.unidade}</td>
                            <td>{al.alimento}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {idx < ref.opcoes.length - 1 && (
                    <div className={styles.ouDivider}>
                      <span>OU</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {exibirCaloriasNoPdf && (
        <div
          className={styles.patientSection}
          style={{ marginTop: '32px', background: '#f0fdf4', border: '1px solid #a7f3d0' }}
        >
          <h3 style={{ width: '100%', margin: '0 0 16px 0', fontSize: '16px', color: '#065f46' }}>
            Resumo Diário ({modoCalculoResumo === 'principal' ? 'Opção Principal' : 'Média das Opções'})
          </h3>
          <div className={styles.infoGroup}>
            <label style={{ color: '#065f46', opacity: 0.8 }}>Calorias</label>
            <span style={{ color: '#047857', fontSize: '18px', fontWeight: 700 }}>
              {totaisResumo.cal.toFixed(0)} kcal
            </span>
          </div>
          <div className={styles.infoGroup}>
            <label style={{ color: '#065f46', opacity: 0.8 }}>Proteínas</label>
            <span style={{ color: '#047857', fontSize: '18px', fontWeight: 700 }}>
              {totaisResumo.prot.toFixed(1)} g
            </span>
          </div>
          <div className={styles.infoGroup}>
            <label style={{ color: '#065f46', opacity: 0.8 }}>Carboidratos</label>
            <span style={{ color: '#047857', fontSize: '18px', fontWeight: 700 }}>
              {totaisResumo.carb.toFixed(1)} g
            </span>
          </div>
          <div className={styles.infoGroup}>
            <label style={{ color: '#065f46', opacity: 0.8 }}>Gorduras</label>
            <span style={{ color: '#047857', fontSize: '18px', fontWeight: 700 }}>
              {totaisResumo.gord.toFixed(1)} g
            </span>
          </div>
          <div className={styles.infoGroup}>
            <label style={{ color: '#065f46', opacity: 0.8 }}>Fibras</label>
            <span style={{ color: '#047857', fontSize: '18px', fontWeight: 700 }}>
              {totaisResumo.fibra.toFixed(1)} g
            </span>
          </div>
        </div>
      )}

      {plano.observacoes && (
        <div className={styles.observacoesGlobal}>
          <h3>Observações Gerais</h3>
          <p>{plano.observacoes}</p>
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.assinatura}>
          <div className={styles.linha} />
          <p className={styles.nomeProfissional}>{usuario?.nome || 'Profissional NutriSaaS'}</p>
          <p className={styles.cargo}>
            {usuario?.crn ? `Nutricionista — ${usuario.crn}` : 'Nutricionista'}
          </p>
          <p className={styles.cargo}>{usuario?.email}</p>
        </div>
      </footer>
    </div>
  );
}
