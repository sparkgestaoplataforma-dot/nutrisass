/* NutriSaaS — Main JS (orchestrator) */

// Navbar scroll effect
const nav = document.getElementById('navbar');
const toggle = document.getElementById('nav-toggle');
const mobile = document.getElementById('nav-mobile');

window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 40);
});

if (toggle && mobile) {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('nav__toggle--active');
    mobile.classList.toggle('nav__mobile--open');
    document.body.style.overflow = mobile.classList.contains('nav__mobile--open') ? 'hidden' : '';
  });
  mobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('nav__toggle--active');
      mobile.classList.remove('nav__mobile--open');
      document.body.style.overflow = '';
    });
  });
}

// Scroll reveal (IntersectionObserver)
const revealEls = document.querySelectorAll('.reveal, .reveal--left, .reveal--right, .reveal--scale, .reveal-stagger');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// FAQ accordion
document.querySelectorAll('.faq__question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq__item');
    const answer = item.querySelector('.faq__answer');
    const isActive = item.classList.contains('faq__item--active');

    // Close all
    document.querySelectorAll('.faq__item--active').forEach(i => {
      i.classList.remove('faq__item--active');
      i.querySelector('.faq__answer').style.maxHeight = '0';
    });

    if (!isActive) {
      item.classList.add('faq__item--active');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// Pricing toggle
const pricingSwitch = document.getElementById('pricing-switch');
if (pricingSwitch) {
  pricingSwitch.addEventListener('click', () => {
    const isAnnual = pricingSwitch.classList.toggle('pricing__switch--annual');
    document.getElementById('label-monthly').classList.toggle('pricing__toggle-label--active', !isAnnual);
    document.getElementById('label-annual').classList.toggle('pricing__toggle-label--active', isAnnual);
    document.querySelector('.pricing__save-badge').classList.toggle('pricing__save-badge--visible', isAnnual);

    document.querySelectorAll('.plan__amount').forEach(el => {
      el.textContent = isAnnual ? el.dataset.annual : el.dataset.monthly;
    });
  });
}


// Agenda animation
function animateAgenda() {
  const appts = document.querySelectorAll('.agenda-appt');
  const notif = document.querySelector('.agenda-notif');
  if (!appts.length) return;

  let i = 0;
  function showNext() {
    if (i < appts.length) {
      appts[i].classList.add('agenda-appt--visible');
      i++;
      setTimeout(showNext, 600);
    } else if (notif) {
      setTimeout(() => notif.classList.add('agenda-notif--visible'), 400);
      setTimeout(() => {
        notif.classList.remove('agenda-notif--visible');
        appts.forEach(a => a.classList.remove('agenda-appt--visible'));
        i = 0;
        setTimeout(showNext, 1000);
      }, 4000);
    }
  }

  const agendaObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      showNext();
      agendaObs.disconnect();
    }
  }, { threshold: 0.3 });

  const agendaSection = document.getElementById('agenda');
  if (agendaSection) agendaObs.observe(agendaSection);
}
animateAgenda();

// Timeline scroll progress
function initTimeline() {
  const progress = document.querySelector('.timeline__progress');
  const track = document.querySelector('.timeline__track');
  const items = document.querySelectorAll('.timeline__item');
  if (!progress || !track) return;

  const timelineObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('revealed');
    });
  }, { threshold: 0.4 });

  items.forEach(item => timelineObs.observe(item));

  window.addEventListener('scroll', () => {
    const rect = track.getBoundingClientRect();
    const trackTop = rect.top;
    const trackHeight = rect.height;
    const windowHeight = window.innerHeight;
    const scrolled = Math.max(0, Math.min(1, (windowHeight * 0.5 - trackTop) / trackHeight));
    progress.style.height = (scrolled * 100) + '%';
  });
}
initTimeline();
