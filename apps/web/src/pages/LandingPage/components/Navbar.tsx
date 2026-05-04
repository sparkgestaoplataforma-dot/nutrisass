import { Link } from 'react-router-dom';

export function Navbar() {
  const handleToggle = () => {
    const toggle = document.getElementById('nav-toggle');
    const mobile = document.getElementById('nav-mobile');
    const nav = document.getElementById('navbar');
    if (!toggle || !mobile || !nav) return;
    toggle.classList.toggle('nav__toggle--active');
    mobile.classList.toggle('nav__mobile--open');
    nav.classList.toggle('nav--menu-open');
    document.body.style.overflow = mobile.classList.contains('nav__mobile--open') ? 'hidden' : '';
  };

  const handleMobileLink = () => {
    const toggle = document.getElementById('nav-toggle');
    const mobile = document.getElementById('nav-mobile');
    const nav = document.getElementById('navbar');
    if (!toggle || !mobile || !nav) return;
    toggle.classList.remove('nav__toggle--active');
    mobile.classList.remove('nav__mobile--open');
    nav.classList.remove('nav--menu-open');
    document.body.style.overflow = '';
  };

  return (
    <nav className="nav" id="navbar">
      <div className="container nav__inner">
        <a href="#" className="nav__logo" aria-label="NutriSaaS">
          <svg className="nav__logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2C12 2 8 6 8 12c0 4 2 8 8 18 6-10 8-14 8-18 0-6-4-10-8-10z" fill="currentColor" opacity="0.2" />
            <path d="M16 4c-3 0-6 3.5-6 9 0 3.5 1.8 7 6 15 4.2-8 6-11.5 6-15 0-5.5-3-9-6-9z" fill="currentColor" />
            <path d="M16 8v12M13 11c1.5 1.5 3 2 3 2M19 14c-1.5-1-3-1.5-3-1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Nutri<span>SaaS</span>
        </a>
        <div className="nav__links">
          <a href="#features" className="nav__link">Funcionalidades</a>
          <a href="#pricing" className="nav__link">Planos</a>
          <a href="#testimonials" className="nav__link">Depoimentos</a>
          <a href="#faq" className="nav__link">FAQ</a>
        </div>
        <div className="nav__cta-group">
          <Link to="/login" className="nav__link">Login</Link>
          <Link to="/cadastro" className="btn btn--primary btn--sm">Vamos começar</Link>
        </div>
        <button className="nav__toggle" id="nav-toggle" aria-label="Menu" onClick={handleToggle}>
          <span className="nav__toggle-bar"></span>
          <span className="nav__toggle-bar"></span>
          <span className="nav__toggle-bar"></span>
        </button>
      </div>
      <div className="nav__mobile" id="nav-mobile">
        <a href="#features" className="nav__mobile-link" onClick={handleMobileLink}>Funcionalidades</a>
        <a href="#pricing" className="nav__mobile-link" onClick={handleMobileLink}>Planos</a>
        <a href="#testimonials" className="nav__mobile-link" onClick={handleMobileLink}>Depoimentos</a>
        <a href="#faq" className="nav__mobile-link" onClick={handleMobileLink}>FAQ</a>
        <Link to="/login" className="nav__mobile-link" onClick={handleMobileLink}>Login</Link>
        <Link to="/cadastro" className="nav__mobile-cta btn btn--primary btn--lg" onClick={handleMobileLink}>Vamos começar</Link>
      </div>
    </nav>
  );
}
