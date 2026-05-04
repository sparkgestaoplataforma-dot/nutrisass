export function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <svg className="footer__logo-icon" viewBox="0 0 32 32" fill="none">
                <path d="M16 4c-3 0-6 3.5-6 9 0 3.5 1.8 7 6 15 4.2-8 6-11.5 6-15 0-5.5-3-9-6-9z" fill="currentColor" />
                <path d="M16 8v12M13 11c1.5 1.5 3 2 3 2M19 14c-1.5-1-3-1.5-3-1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Nutri<span>SaaS</span>
            </div>
            <p className="footer__tagline">Gestão inteligente para clínicas de nutrição. Tecnologia com leveza humana.</p>
            <div className="footer__social">
              <a href="#" className="footer__social-link" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" className="footer__social-link" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="#" className="footer__social-link" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
                  <polygon points="9.75,15.02 15.5,11.75 9.75,8.48" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>
          <div className="footer__col">
            <h4 className="footer__col-title">Produto</h4>
            <nav className="footer__links">
              <a href="#features" className="footer__link">Funcionalidades</a>
              <a href="#pricing" className="footer__link">Planos</a>
              <a href="#testimonials" className="footer__link">Depoimentos</a>
              <a href="#faq" className="footer__link">FAQ</a>
            </nav>
          </div>
          <div className="footer__col">
            <h4 className="footer__col-title">Empresa</h4>
            <nav className="footer__links">
              <a href="#" className="footer__link">Sobre nós</a>
              <a href="#" className="footer__link">Blog</a>
              <a href="#" className="footer__link">Carreiras</a>
            </nav>
          </div>
          <div className="footer__col">
            <h4 className="footer__col-title">Contato</h4>
            <div className="footer__contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              contato@nutrisaas.com.br
            </div>
            <div className="footer__contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              (11) 99999-0000
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 NutriSaaS. Todos os direitos reservados.</span>
          <span>
            Feito com
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green-400)" strokeWidth="2" strokeLinecap="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
              <path d="M12 22c4-4 8-7.5 8-12S16.4 2 12 2 4 5.5 4 10s4 8 8 12z" />
            </svg>
            {' '}para nutricionistas
          </span>
        </div>
      </div>
    </footer>
  );
}
