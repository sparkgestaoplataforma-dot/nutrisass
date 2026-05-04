export function TimelineSection() {
  return (
    <section className="timeline-section section" id="timeline">
      <div className="container">
        <div className="timeline__header reveal">
          <div className="section__badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Evolução Real
          </div>
          <h2 className="section__title">Acompanhe cada passo<br />da jornada do paciente</h2>
          <p className="section__subtitle mx-auto" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Veja como o NutriSaaS transforma dados em uma história visual de progresso.
          </p>
        </div>
        <div className="timeline__track">
          <div className="timeline__line"><div className="timeline__progress"></div></div>
          <div className="timeline__item reveal">
            <div className="timeline__marker"></div>
            <div className="timeline__card">
              <div className="timeline__date">1ª Consulta — 15 Jan</div>
              <div className="timeline__card-title">Avaliação Inicial</div>
              <div className="timeline__card-desc">Anamnese completa, antropometria e definição de metas. Paciente com objetivo de reeducação alimentar.</div>
              <div className="timeline__stat">
                <span className="timeline__stat-value">78.5 kg</span>
                <span className="timeline__stat-label">Peso inicial</span>
              </div>
            </div>
          </div>
          <div className="timeline__item reveal">
            <div className="timeline__marker"></div>
            <div className="timeline__card">
              <div className="timeline__date">Retorno — 12 Fev</div>
              <div className="timeline__card-title">Primeiros Resultados</div>
              <div className="timeline__card-desc">Paciente relata mais disposição. Redução de medidas abdominais e melhora nos exames laboratoriais.</div>
              <div className="timeline__stat">
                <span className="timeline__stat-value">-2.3 kg</span>
                <span className="timeline__stat-label">Peso perdido</span>
              </div>
            </div>
          </div>
          <div className="timeline__item reveal">
            <div className="timeline__marker"></div>
            <div className="timeline__card">
              <div className="timeline__date">Acompanhamento — 18 Mar</div>
              <div className="timeline__card-title">Evolução Consistente</div>
              <div className="timeline__card-desc">Ajuste de plano alimentar. Questionário de hipersensibilidade identifica intolerância à lactose.</div>
              <div className="timeline__stat">
                <span className="timeline__stat-value">-4.8 kg</span>
                <span className="timeline__stat-label">Total perdido</span>
              </div>
            </div>
          </div>
          <div className="timeline__item reveal">
            <div className="timeline__marker"></div>
            <div className="timeline__card">
              <div className="timeline__date">Resultado — 22 Abr</div>
              <div className="timeline__card-title">
                Meta Atingida
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ verticalAlign: 'text-bottom', marginLeft: 4, color: 'var(--green-600)' }}>
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </div>
              <div className="timeline__card-desc">Paciente atinge peso ideal com melhora significativa em todos os indicadores. Plano de manutenção definido.</div>
              <div className="timeline__stat">
                <span className="timeline__stat-value">-7.2 kg</span>
                <span className="timeline__stat-label">Resultado final</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
