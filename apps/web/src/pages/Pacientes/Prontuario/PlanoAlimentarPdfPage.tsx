import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { PrinterIcon, ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { buscarPlano } from '@/services/planoAlimentar';
import { useClinicalAccess } from '@/hooks/useClinicalAccess';
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

export function PlanoAlimentarPdfPage() {
  const { pacienteId, id } = useParams<{ pacienteId: string; id: string }>();
  const navigate = useNavigate();
  const hasClinicalAccess = useClinicalAccess();

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

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['plano-alimentar', id],
    queryFn: () => buscarPlano(id!),
    enabled: hasClinicalAccess && !!id,
  });

  const plano = response?.data;

  const totaisMedios = useMemo(() => {
    if (!plano) return { cal: 0, prot: 0, carb: 0, gord: 0 };
    let cal = 0, prot = 0, carb = 0, gord = 0;
    
    plano.refeicoes.forEach(ref => {
      if (!ref.opcoes || ref.opcoes.length === 0) return;
      
      let refCal = 0, refProt = 0, refCarb = 0, refGord = 0;
      
      ref.opcoes.forEach(opc => {
        refCal += opc.alimentos.reduce((acc, al) => acc + (al.calorias || 0), 0);
        refProt += opc.alimentos.reduce((acc, al) => acc + (al.proteinas || 0), 0);
        refCarb += opc.alimentos.reduce((acc, al) => acc + (al.carboidratos || 0), 0);
        refGord += opc.alimentos.reduce((acc, al) => acc + (al.gorduras || 0), 0);
      });
      
      // Soma a média das opções dessa refeição
      cal += refCal / ref.opcoes.length;
      prot += refProt / ref.opcoes.length;
      carb += refCarb / ref.opcoes.length;
      gord += refGord / ref.opcoes.length;
    });
    
    return { cal, prot, carb, gord };
  }, [plano]);

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados do plano...</div>;
  }

  if (error || !plano) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Erro ao carregar plano alimentar</h2>
        <button onClick={handleBack} className={styles.backBtn}>Voltar</button>
      </div>
    );
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

  const paciente = plano.paciente;
  const clinica = plano.clinica;
  const usuario = plano.usuario;
  const logoSrc = getLogomarcaSrc(clinica?.logomarca);

  function handlePrint() {
    window.print();
  }

  return (
    <div className={styles.pdfContainer}>
      <div className={`${styles.controls} ${styles.noPrint}`}>
        <button className={styles.backBtn} onClick={handleBack}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          Voltar
        </button>
        <button className={styles.printBtn} onClick={handlePrint}>
          <HugeiconsIcon icon={PrinterIcon} size={18} />
          Imprimir / Salvar PDF
        </button>
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
        {plano.refeicoes.map((ref) => (
          <div key={ref.id} className={styles.refeicao}>
            <div className={styles.refeicaoHeader}>
              <h3>{ref.nome}</h3>
              <span>{ref.horario}</span>
            </div>
            
            <div className={styles.opcoes}>
              {ref.opcoes.map((opc, idx) => (
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
                        {opc.alimentos.map((al) => (
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

      <div className={styles.patientSection} style={{ marginTop: '32px', background: '#f0fdf4', border: '1px solid #a7f3d0' }}>
        <h3 style={{ width: '100%', margin: '0 0 16px 0', fontSize: '16px', color: '#065f46' }}>
          Resumo Diário (Média de todas as opções)
        </h3>
        <div className={styles.infoGroup}>
          <label style={{ color: '#065f46', opacity: 0.8 }}>Calorias</label>
          <span style={{ color: '#047857', fontSize: '18px', fontWeight: 700 }}>
            {totaisMedios.cal.toFixed(1)} kcal
          </span>
        </div>
        <div className={styles.infoGroup}>
          <label style={{ color: '#065f46', opacity: 0.8 }}>Proteínas</label>
          <span style={{ color: '#047857', fontSize: '18px', fontWeight: 700 }}>
            {totaisMedios.prot.toFixed(1)} g
          </span>
        </div>
        <div className={styles.infoGroup}>
          <label style={{ color: '#065f46', opacity: 0.8 }}>Carboidratos</label>
          <span style={{ color: '#047857', fontSize: '18px', fontWeight: 700 }}>
            {totaisMedios.carb.toFixed(1)} g
          </span>
        </div>
        <div className={styles.infoGroup}>
          <label style={{ color: '#065f46', opacity: 0.8 }}>Gorduras</label>
          <span style={{ color: '#047857', fontSize: '18px', fontWeight: 700 }}>
            {totaisMedios.gord.toFixed(1)} g
          </span>
        </div>
      </div>

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
          <p className={styles.cargo}>Nutricionista</p>
          <p className={styles.cargo}>{usuario?.email}</p>
        </div>
      </footer>
    </div>
  );
}
