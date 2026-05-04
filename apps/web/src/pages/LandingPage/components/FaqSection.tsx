import { useRef } from 'react';
import { PlusIcon } from './Icons';

const faqItems = [
  { q: 'O NutriSaaS funciona no celular?', a: 'Sim! O NutriSaaS é 100% responsivo e funciona perfeitamente em qualquer dispositivo — celular, tablet ou computador. Acesse de qualquer lugar, a qualquer momento.' },
  { q: 'Preciso instalar algo?', a: 'Não! O NutriSaaS funciona diretamente no navegador. Basta acessar o link e começar a usar. Sem downloads, sem instalações, sem complicações.' },
  { q: 'Como funciona o período de teste?', a: 'Você tem 14 dias grátis para testar todas as funcionalidades do plano escolhido, sem precisar cadastrar cartão de crédito. Ao final do período, você decide se quer continuar.' },
  { q: 'Posso migrar meus dados de outro sistema?', a: 'Sim! Nossa equipe oferece suporte completo de migração. Ajudamos você a transferir pacientes, prontuários e históricos de outros sistemas ou planilhas.' },
  { q: 'O sistema é seguro?', a: 'Totalmente. Utilizamos criptografia de ponta a ponta, isolamento completo por clínica (multi-tenant), backups diários automáticos e autenticação segura com JWT.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem multa e sem contrato de fidelidade. Você pode cancelar quando quiser diretamente pelo painel administrativo.' },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const answerRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    const item = itemRef.current;
    const answerEl = answerRef.current;
    if (!item || !answerEl) return;

    const isActive = item.classList.contains('faq__item--active');

    // Close all
    document.querySelectorAll('.faq__item--active').forEach(i => {
      i.classList.remove('faq__item--active');
      const ans = i.querySelector('.faq__answer') as HTMLElement;
      if (ans) ans.style.maxHeight = '0';
    });

    if (!isActive) {
      item.classList.add('faq__item--active');
      answerEl.style.maxHeight = answerEl.scrollHeight + 'px';
    }
  };

  return (
    <div className="faq__item" ref={itemRef}>
      <button className="faq__question" onClick={handleClick}>
        {question}
        <span className="faq__icon"><PlusIcon /></span>
      </button>
      <div className="faq__answer" ref={answerRef}>
        <div className="faq__answer-inner">{answer}</div>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="faq section section--alt" id="faq">
      <div className="container">
        <div className="faq__header reveal">
          <div className="section__badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
            Dúvidas
          </div>
          <h2 className="section__title">Perguntas frequentes</h2>
          <p className="section__subtitle mx-auto">Tudo que você precisa saber antes de começar.</p>
        </div>
        <div className="faq__list reveal">
          {faqItems.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
        <div className="faq__cta reveal">
          <p className="faq__cta-text">Ainda tem dúvidas? Fale diretamente com a gente.</p>
          <a href="https://wa.me/5511999990000" className="btn btn--primary" target="_blank" rel="noreferrer">Falar no WhatsApp</a>
        </div>
      </div>
    </section>
  );
}
