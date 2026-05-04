import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, XIcon } from '@/pages/LandingPage/components/Icons';

import '@/pages/LandingPage/styles/variables.css';
import '@/pages/LandingPage/styles/base.css';
import '@/pages/LandingPage/styles/pricing.css';
import onboardingStyles from './OnboardingPage.module.scss';

interface PlanFeature {
  text: string;
  disabled?: boolean;
  highlight?: string;
}

interface Plan {
  name: string;
  tagline: string;
  monthly: number;
  annual: number;
  featured?: boolean;
  icon: React.ReactNode;
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    name: 'Essencial',
    tagline: 'Começando organizado',
    monthly: 97,
    annual: 77,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green-500)" strokeWidth="2" strokeLinecap="round">
        <path d="M7 20.981a6 6 0 01-.813-8.726L12 5l5.813 7.255A6 6 0 0117 20.981" />
        <path d="M12 5v15" />
      </svg>
    ),
    features: [
      { text: '1 nutricionista' },
      { text: 'Agenda completa' },
      { text: 'Cadastro de pacientes' },
      { text: 'Prontuário básico' },
      { text: 'Relatórios simples' },
      { text: 'Suporte por email' },
      { text: 'Comparativo de evolução', disabled: true },
      { text: 'Gestão de exames', disabled: true },
      { text: 'Questionários', disabled: true },
    ],
  },
  {
    name: 'Profissional',
    tagline: 'Crescendo com controle',
    monthly: 197,
    annual: 157,
    featured: true,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)" strokeWidth="2" strokeLinecap="round">
        <path d="M12 22c4-4 8-7.5 8-12S16.4 2 12 2 4 5.5 4 10s4 8 8 12z" />
        <path d="M12 6v10M9 9c1.5 1 3 1.5 3 1.5M15 12c-1.5-.5-3-1-3-1" />
      </svg>
    ),
    features: [
      { text: 'Até 5 nutricionistas' },
      { text: 'Tudo do Essencial' },
      { text: 'Comparativo de evolução', highlight: 'Exclusivo' },
      { text: 'Gestão de exames' },
      { text: 'Questionários inteligentes' },
      { text: 'Relatórios avançados' },
      { text: 'Permissões (admin/secretária)' },
      { text: 'Suporte por chat' },
      { text: 'Multi-unidades', disabled: true },
    ],
  },
  {
    name: 'Clínica Avançada',
    tagline: 'Gestão completa e inteligente',
    monthly: 347,
    annual: 277,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" strokeWidth="2" strokeLinecap="round">
        <path d="M12 22V8" />
        <path d="M5 12a7 7 0 0114 0" />
        <path d="M7 8a5 5 0 0110 0" />
        <path d="M9 5a3 3 0 016 0" />
      </svg>
    ),
    features: [
      { text: 'Nutricionistas ilimitados' },
      { text: 'Tudo do Profissional' },
      { text: 'Multi-unidades' },
      { text: 'Dashboard completo (KPIs)' },
      { text: 'Métricas avançadas' },
      { text: 'Customizações leves' },
      { text: 'Suporte prioritário' },
      { text: 'Onboarding dedicado' },
    ],
  },
];

export function PlanSelectionPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();

  const handleToggle = () => setIsAnnual(prev => !prev);

  const handleSelectPlan = (planName: string) => {
    // In a real application, you would save this to the API
    console.log(`Plano selecionado: ${planName}`);
    navigate('/dashboard');
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      paddingTop: '3rem', 
      paddingBottom: '3rem', 
      minHeight: '100vh', 
      background: '#faf9f7' 
    }}>
      <section className="pricing" style={{ width: '100%', padding: 0 }}>
        <div className="container">
          <div className="pricing__header" style={{ marginBottom: '3rem' }}>
            <h2 className="section__title" style={{ fontSize: '2rem' }}>Escolha seu plano</h2>
            <p className="section__subtitle mx-auto">Sua clínica foi cadastrada com sucesso! Escolha o plano ideal para você começar com o pé direito (você pode alterar depois).</p>
          </div>
          
          <div className="pricing__toggle" style={{ marginBottom: '3rem' }}>
            <span className={`pricing__toggle-label ${!isAnnual ? 'pricing__toggle-label--active' : ''}`} onClick={() => setIsAnnual(false)} style={{cursor: 'pointer'}}>Mensal</span>
            <div className={`pricing__switch ${isAnnual ? 'pricing__switch--annual' : ''}`} onClick={handleToggle} style={{cursor: 'pointer'}}>
              <div className="pricing__switch-knob"></div>
            </div>
            <span className={`pricing__toggle-label ${isAnnual ? 'pricing__toggle-label--active' : ''}`} onClick={() => setIsAnnual(true)} style={{cursor: 'pointer'}}>Anual</span>
            <span className={`pricing__save-badge ${isAnnual ? 'pricing__save-badge--visible' : ''}`}>Economize 20%</span>
          </div>
          
          <div className="pricing__grid">
            {plans.map((plan) => (
              <div key={plan.name} className={`plan ${plan.featured ? 'plan--featured' : ''}`} style={{ background: '#ffffff', textAlign: 'left' }}>
                {plan.featured && <div className="plan__popular">Recomendado</div>}
                <div className="plan__icon">{plan.icon}</div>
                <div className="plan__name">{plan.name}</div>
                <div className="plan__tagline">{plan.tagline}</div>
                <div className="plan__price-wrapper">
                  <div className="plan__price">
                    <span className="plan__currency">R$</span>
                    <span className="plan__amount">{isAnnual ? plan.annual : plan.monthly}</span>
                    <span className="plan__period">/mês</span>
                  </div>
                </div>
                <ul className="plan__features">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`plan__feature ${f.disabled ? 'plan__feature--disabled' : ''}`}>
                      <span className={`plan__feature-icon ${f.disabled ? 'plan__feature-icon--x' : 'plan__feature-icon--check'}`}>
                        {f.disabled ? <XIcon /> : <CheckIcon />}
                      </span>
                      {f.text}
                      {f.highlight && (
                        <span className="plan__feature-highlight">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ verticalAlign: 'baseline', marginRight: 2 }}>
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                          </svg>
                          {f.highlight}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleSelectPlan(plan.name)} 
                  className={`btn ${plan.featured ? 'btn--primary' : 'btn--secondary'} plan__cta`}
                  style={{ width: '100%', cursor: 'pointer', marginTop: 'auto' }}
                >
                  Selecionar {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
