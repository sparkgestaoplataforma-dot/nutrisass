import { StarRating } from './StarRating';

const testimonials = [
  { quote: 'Finalmente um sistema que entende a rotina do nutricionista. A agenda em tempo real mudou minha clínica completamente.', name: 'Dra. Camila Ferreira', clinic: 'NutriVida Clínica', initials: 'CF', variant: 1, stars: 5 },
  { quote: 'O comparativo de evolução é absurdo. Meus pacientes adoram ver o progresso visualmente. Virou ferramenta de motivação.', name: 'Dr. Rafael Mendes', clinic: 'Clínica Equilíbrio', initials: 'RM', variant: 2, stars: 5 },
  { quote: 'Saí do papel para o NutriSaaS e nunca mais voltei. Organização total, meus atendimentos ficaram muito mais eficientes.', name: 'Dra. Juliana Costa', clinic: 'NutriCare', initials: 'JC', variant: 3, stars: 5 },
  { quote: 'Interface linda e fácil de usar. Minha secretária aprendeu em 10 minutos. O suporte é excelente e muito atencioso.', name: 'Dra. Amanda Lopes', clinic: 'Espaço Nutrir', initials: 'AL', variant: 4, stars: 4.5 },
  { quote: 'O melhor investimento que fiz para minha clínica. O dashboard me dá visão completa de tudo que acontece.', name: 'Dr. Lucas Oliveira', clinic: 'Clínica NutriForma', initials: 'LO', variant: 5, stars: 5 },
  { quote: 'Os relatórios avançados me ajudam a tomar decisões melhores. Consigo ver padrões que antes eram invisíveis.', name: 'Dra. Beatriz Santos', clinic: 'Vida & Saúde Nutrição', initials: 'BS', variant: 6, stars: 5 },
];

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  const hasHalf = t.stars % 1 !== 0;
  return (
    <div className="testimonial-card">
      <div className="testimonial-card__inner">
        <StarRating count={Math.ceil(t.stars)} hasHalf={hasHalf} />
        <p className="testimonial-card__quote">{t.quote}</p>
        <div className="testimonial-card__author">
          <div className={`testimonial-card__avatar testimonial-card__avatar--${t.variant}`}>{t.initials}</div>
          <div>
            <div className="testimonial-card__name">{t.name}</div>
            <div className="testimonial-card__clinic">{t.clinic}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="testimonials section" id="testimonials">
      <div className="container">
        <div className="testimonials__header reveal">
          <div className="section__badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Depoimentos
          </div>
          <h2 className="section__title">Quem usa, recomenda</h2>
          <p className="section__subtitle mx-auto">Veja o que nutricionistas de todo o Brasil dizem sobre o NutriSaaS.</p>
        </div>
        <div className="testimonials__carousel reveal">
          <div className="testimonials__marquee">
            <div className="testimonials__track">
              {testimonials.map((t, i) => <TestimonialCard key={i} t={t} />)}
            </div>
            <div className="testimonials__track" aria-hidden="true">
              {testimonials.map((t, i) => <TestimonialCard key={`clone-${i}`} t={t} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
