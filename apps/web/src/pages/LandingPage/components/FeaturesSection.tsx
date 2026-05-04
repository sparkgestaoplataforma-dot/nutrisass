export function FeaturesSection() {
  return (
    <section className="features section" id="features">
      <div className="container">
        <div className="features__header reveal">
          <div className="section__badge">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10" />
            </svg>
            Funcionalidades
          </div>
          <h2 className="section__title">
            Tudo que sua clínica precisa,
            <br />
            em um só sistema
          </h2>
          <p className="section__subtitle mx-auto">
            Ferramentas pensadas para a rotina real do nutricionista. Sem
            complicação, sem excesso.
          </p>
        </div>
        <div className="features__grid">
          {/* Feature 1: Prontuário */}
          <div className="feature reveal">
            <div className="feature__content">
              <div className="feature__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M9 12h6M12 9v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="feature__label">Core Nutricional</div>
              <h3 className="feature__title">
                Prontuário completo e inteligente
              </h3>
              <p className="feature__desc">
                Evolução clínica, antropometria, medidas corporais e conduta —
                tudo registrado de forma organizada e acessível.
              </p>
              <div className="feature__tags">
                <span className="feature__tag">Antropometria</span>
                <span className="feature__tag">Evolução</span>
                <span className="feature__tag">Conduta</span>
              </div>
            </div>
            <div className="feature__visual">
              <div className="feature-mockup">
                <div className="feature-mockup__header">
                  <span className="feature-mockup__header-title">
                    Prontuário — Ana Silva
                  </span>
                  <span className="mockup-badge">Ativo</span>
                </div>
                <div className="feature-mockup__body">
                  <div className="mockup-patient">
                    <div className="mockup-patient__avatar">AS</div>
                    <div>
                      <div className="mockup-patient__name">
                        Ana Carolina Silva
                      </div>
                      <div className="mockup-patient__meta">
                        32 anos • Reeducação alimentar
                      </div>
                    </div>
                  </div>
                  <div className="mockup-data-row">
                    <span className="mockup-data-row__label">Peso</span>
                    <span className="mockup-data-row__value">68.5 kg</span>
                    <span className="mockup-data-row__trend mockup-data-row__trend--down">
                      ↓ 1.2kg
                    </span>
                  </div>
                  <div className="mockup-data-row">
                    <span className="mockup-data-row__label">IMC</span>
                    <span className="mockup-data-row__value">24.8</span>
                    <span className="mockup-data-row__trend mockup-data-row__trend--down">
                      ↓ 0.4
                    </span>
                  </div>
                  <div className="mockup-data-row">
                    <span className="mockup-data-row__label">% Gordura</span>
                    <span className="mockup-data-row__value">28.3%</span>
                    <span className="mockup-data-row__trend mockup-data-row__trend--down">
                      ↓ 1.1%
                    </span>
                  </div>
                  <div className="mockup-data-row">
                    <span className="mockup-data-row__label">Massa Magra</span>
                    <span className="mockup-data-row__value">49.1 kg</span>
                    <span className="mockup-data-row__trend mockup-data-row__trend--up">
                      ↑ 0.3kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Agenda */}
          <div className="feature reveal">
            <div className="feature__content">
              <div className="feature__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <div className="feature__label">Produtividade</div>
              <h3 className="feature__title">
                Agenda inteligente em tempo real
              </h3>
              <p className="feature__desc">
                Sua secretária marca, você vê na hora. Atualização instantânea
                com tecnologia de tempo real, sem recarregar a página.
              </p>
              <div className="feature__tags">
                <span className="feature__tag">Tempo real</span>
                <span className="feature__tag">Multi-profissional</span>
              </div>
            </div>
            <div className="feature__visual">
              <div className="feature-mockup">
                <div className="feature-mockup__header">
                  <span className="feature-mockup__header-title">
                    Agenda — Hoje
                  </span>
                  <span className="mockup-realtime-badge">
                    <span className="mockup-realtime-badge__dot"></span> Ao vivo
                  </span>
                </div>
                <div className="feature-mockup__body">
                  <div className="mockup-schedule">
                    <div className="mockup-schedule__slot mockup-schedule__slot--booked">
                      <span className="mockup-schedule__time">08:00</span>
                      <div className="mockup-schedule__info">
                        <strong>Maria Oliveira</strong>Retorno
                      </div>
                    </div>
                    <div className="mockup-schedule__slot mockup-schedule__slot--current">
                      <span className="mockup-schedule__time">09:00</span>
                      <div className="mockup-schedule__info">
                        <strong>João Santos</strong>1ª Consulta
                      </div>
                    </div>
                    <div className="mockup-schedule__slot mockup-schedule__slot--booked">
                      <span className="mockup-schedule__time">10:00</span>
                      <div className="mockup-schedule__info">
                        <strong>Carla Mendes</strong>Avaliação
                      </div>
                    </div>
                    <div className="mockup-schedule__slot">
                      <span className="mockup-schedule__time">11:00</span>
                      <div
                        className="mockup-schedule__info"
                        style={{ color: "var(--neutral-400)" }}
                      >
                        Disponível
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Comparativo */}
          <div className="feature reveal">
            <div className="feature__content">
              <div className="feature__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className="feature__label">
                Diferencial
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ verticalAlign: "text-top", marginLeft: 2 }}
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h3 className="feature__title">Comparativo de evolução visual</h3>
              <p className="feature__desc">
                Seus pacientes veem o progresso de forma visual. Compare medidas
                entre consultas com gráficos claros e motivadores.
              </p>
              <div className="feature__tags">
                <span className="feature__tag">Gráficos</span>
                <span className="feature__tag">Filtros por data</span>
                <span className="feature__tag">Motivacional</span>
              </div>
            </div>
            <div className="feature__visual">
              <div className="feature-mockup">
                <div className="feature-mockup__header">
                  <span className="feature-mockup__header-title">
                    Evolução — Ana Silva
                  </span>
                </div>
                <div className="feature-mockup__body">
                  <div className="mockup-mini-chart">
                    {[90, 82, 75, 70].map((h, i) => (
                      <div
                        key={i}
                        className="mockup-mini-chart__bar"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                    {[65, 58, 52].map((h, i) => (
                      <div
                        key={`a${i}`}
                        className="mockup-mini-chart__bar mockup-mini-chart__bar--active"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 8,
                    }}
                  >
                    {["Jan", "Fev", "Mar", "Abr"].map((m) => (
                      <span
                        key={m}
                        style={{ fontSize: 9, color: "var(--neutral-400)" }}
                      >
                        {m}
                      </span>
                    ))}
                    {["Mai", "Jun", "Jul"].map((m) => (
                      <span
                        key={m}
                        style={{
                          fontSize: 9,
                          color: "var(--green-600)",
                          fontWeight: 600,
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <div className="mockup-data-row" style={{ marginTop: 12 }}>
                    <span className="mockup-data-row__label">
                      Peso total perdido
                    </span>
                    <span className="mockup-data-row__trend mockup-data-row__trend--down">
                      ↓ 7.2 kg
                    </span>
                  </div>
                  <div className="mockup-data-row">
                    <span className="mockup-data-row__label">
                      % Gordura reduzido
                    </span>
                    <span className="mockup-data-row__trend mockup-data-row__trend--down">
                      ↓ 4.8%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Exames */}
          <div className="feature reveal">
            <div className="feature__content">
              <div className="feature__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
              </div>
              <div className="feature__label">Clínico</div>
              <h3 className="feature__title">Gestão completa de exames</h3>
              <p className="feature__desc">
                Solicite exames laboratoriais e acompanhe os resultados em um só
                lugar. Histórico completo por paciente.
              </p>
              <div className="feature__tags">
                <span className="feature__tag">Solicitação</span>
                <span className="feature__tag">Resultados</span>
                <span className="feature__tag">Histórico</span>
              </div>
            </div>
            <div className="feature__visual">
              <div className="feature-mockup">
                <div className="feature-mockup__header">
                  <span className="feature-mockup__header-title">
                    Exames — Resultados
                  </span>
                </div>
                <div className="feature-mockup__body">
                  <div className="mockup-data-row">
                    <span className="mockup-data-row__label">Glicemia</span>
                    <span className="mockup-data-row__value">92 mg/dL</span>
                    <span className="mockup-badge">Normal</span>
                  </div>
                  <div className="mockup-data-row">
                    <span className="mockup-data-row__label">
                      Colesterol Total
                    </span>
                    <span className="mockup-data-row__value">185 mg/dL</span>
                    <span className="mockup-badge">Normal</span>
                  </div>
                  <div className="mockup-data-row">
                    <span className="mockup-data-row__label">TSH</span>
                    <span className="mockup-data-row__value">2.4 mUI/L</span>
                    <span className="mockup-badge">Normal</span>
                  </div>
                  <div className="mockup-data-row">
                    <span className="mockup-data-row__label">Vitamina D</span>
                    <span className="mockup-data-row__value">18 ng/mL</span>
                    <span
                      className="mockup-badge"
                      style={{ background: "#fff3cd", color: "#856404" }}
                    >
                      Atenção
                    </span>
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
