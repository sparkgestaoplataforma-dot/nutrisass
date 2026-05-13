import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { PrinterIcon, ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { buscarPlano } from '@/services/planoAlimentar';
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['plano-alimentar', id],
    queryFn: () => buscarPlano(id!),
    enabled: !!id,
  });

  useEffect(() => {
    // Automatically trigger print dialog when data is loaded, optionally
    // But since users might want to see it first, we'll let them click the print button.
  }, [response]);

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados do plano...</div>;
  }

  if (error || !response?.data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Erro ao carregar plano alimentar</h2>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>Voltar</button>
      </div>
    );
  }

  const plano = response.data;
  const paciente = plano.paciente;
  const clinica = plano.clinica;
  const usuario = plano.usuario;

  function handlePrint() {
    window.print();
  }

  return (
    <div className={styles.pdfContainer}>
      <div className={`${styles.controls} ${styles.noPrint}`}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
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
          {clinica?.logomarca ? (
            <img src={`/api/uploads/${clinica.logomarca}`} alt={clinica.nome || 'Logo da clínica'} />
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
                <div key={opc.id} className={styles.opcao}>
                  {ref.opcoes.length > 1 && (
                    <h4 className={styles.opcaoTitle}>{opc.nome || `Opção ${idx + 1}`}</h4>
                  )}
                  
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.colQtde}>Qtde</th>
                        <th className={styles.colMedida}>Medida</th>
                        <th className={styles.colAlimento}>Alimento</th>
                        <th className={styles.colObs}>Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opc.alimentos.map((al) => (
                        <tr key={al.id}>
                          <td>{al.quantidade}</td>
                          <td>{al.unidade}</td>
                          <td>{al.alimento}</td>
                          <td>{al.observacao || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.patientSection} style={{ marginTop: '32px', background: '#eff6ff' }}>
        <h3 style={{ width: '100%', margin: '0 0 16px 0', fontSize: '16px', color: '#1e40af' }}>Resumo Diário (Médio)</h3>
        <div className={styles.infoGroup}>
          <label>Calorias</label>
          <span style={{ color: '#1e40af' }}>
            {Math.round(plano.refeicoes.reduce((acc, r) => acc + (r.opcoes[0]?.alimentos.reduce((sum, al) => sum + (al.calorias || 0), 0) || 0), 0))} kcal
          </span>
        </div>
        <div className={styles.infoGroup}>
          <label>Proteínas</label>
          <span style={{ color: '#1e40af' }}>
            {Math.round(plano.refeicoes.reduce((acc, r) => acc + (r.opcoes[0]?.alimentos.reduce((sum, al) => sum + (al.proteinas || 0), 0) || 0), 0))} g
          </span>
        </div>
        <div className={styles.infoGroup}>
          <label>Carboidratos</label>
          <span style={{ color: '#1e40af' }}>
            {Math.round(plano.refeicoes.reduce((acc, r) => acc + (r.opcoes[0]?.alimentos.reduce((sum, al) => sum + (al.carboidratos || 0), 0) || 0), 0))} g
          </span>
        </div>
        <div className={styles.infoGroup}>
          <label>Gorduras</label>
          <span style={{ color: '#1e40af' }}>
            {Math.round(plano.refeicoes.reduce((acc, r) => acc + (r.opcoes[0]?.alimentos.reduce((sum, al) => sum + (al.gorduras || 0), 0) || 0), 0))} g
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
