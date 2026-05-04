export function HeroSection() {
  return (
    <section className="hero section" id="hero">
      <div className="hero__bg">
        <div className="hero__blob hero__blob--1"></div>
        <div className="hero__blob hero__blob--2"></div>
        <div className="hero__blob hero__blob--3"></div>
      </div>
      <div className="container">
        <div className="hero__content">
          <div className="hero__badge">
            <span className="hero__badge-dot"></span> Gestão inteligente para nutricionistas
          </div>
          <h1 className="hero__title">
            Sua clínica de nutrição merece mais que <em>planilhas</em>
          </h1>
          <p className="hero__subtitle">
            Gestão inteligente, prontuário completo e agenda em tempo real — tudo em um só lugar, com a leveza que sua rotina precisa.
          </p>
          <div className="hero__cta-group">
            <a href="#pricing" className="btn btn--primary btn--lg">Agendar demonstração</a>
            <a href="#features" className="btn btn--secondary btn--lg">Conhecer funcionalidades</a>
          </div>
          <div className="hero__stats">
            <div className="hero__stat">
              <div className="hero__stat-value">500+</div>
              <div className="hero__stat-label">Nutricionistas</div>
            </div>
            <div className="hero__stat-divider"></div>
            <div className="hero__stat">
              <div className="hero__stat-value">98%</div>
              <div className="hero__stat-label">Satisfação</div>
            </div>
            <div className="hero__stat-divider"></div>
            <div className="hero__stat">
              <div className="hero__stat-value">0</div>
              <div className="hero__stat-label">Contrato mínimo</div>
            </div>
          </div>
        </div>
        <div className="hero__mockup-wrapper">
          <div className="mockup-browser">
            <div className="mockup-browser__header">
              <span className="mockup-dot"></span><span className="mockup-dot"></span><span className="mockup-dot"></span>
              <div className="mockup-url">app.nutrisaas.com.br</div>
            </div>
            <div className="mockup-browser__content">
              <div className="mockup-sidebar">
                <div className="mockup-sidebar__icon mockup-sidebar__icon--active"><span></span></div>
                <div className="mockup-sidebar__icon"><span></span></div>
                <div className="mockup-sidebar__icon"><span></span></div>
                <div className="mockup-sidebar__icon"><span></span></div>
                <div className="mockup-sidebar__icon"><span></span></div>
              </div>
              <div className="mockup-main">
                <div className="mockup-topbar">
                  <div className="mockup-topbar__title">Dashboard — Visão Geral</div>
                  <div className="mockup-topbar__avatar"></div>
                </div>
                <div className="mockup-cards">
                  <div className="mockup-card">
                    <div className="mockup-card__label">Pacientes</div>
                    <div className="mockup-card__value">248</div>
                    <div className="mockup-card__trend">↑ 12%</div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-card__label">Consultas Hoje</div>
                    <div className="mockup-card__value">14</div>
                    <div className="mockup-card__trend">↑ 8%</div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-card__label">Retorno</div>
                    <div className="mockup-card__value">89%</div>
                    <div className="mockup-card__trend">↑ 3%</div>
                  </div>
                </div>
                <div className="mockup-chart">
                  <div className="mockup-chart__title">Atendimentos — Últimos 7 dias</div>
                  <div className="mockup-chart__bars">
                    {[
                      { h: '45%', bg: 'var(--green-200)', d: 0.3 },
                      { h: '65%', bg: 'var(--green-300)', d: 0.4 },
                      { h: '50%', bg: 'var(--green-200)', d: 0.5 },
                      { h: '80%', bg: 'var(--green-400)', d: 0.6 },
                      { h: '70%', bg: 'var(--green-300)', d: 0.7 },
                      { h: '90%', bg: 'var(--green-500)', d: 0.8 },
                      { h: '60%', bg: 'var(--green-300)', d: 0.9 },
                    ].map((bar, i) => (
                      <div key={i} className="mockup-chart__bar" style={{ height: bar.h, background: bar.bg, '--delay': bar.d } as React.CSSProperties}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
