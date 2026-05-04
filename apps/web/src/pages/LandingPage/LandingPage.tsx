import { useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { TimelineSection } from "./components/TimelineSection";
import { AgendaSection } from "./components/AgendaSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { PricingSection } from "./components/PricingSection";
import { FaqSection } from "./components/FaqSection";
import { Footer } from "./components/Footer";

// Landing page CSS imports
import "./styles/variables.css";
import "./styles/reset.css";
import "./styles/base.css";
import "./styles/navbar.css";
import "./styles/hero.css";
import "./styles/features.css";
import "./styles/timeline.css";
import "./styles/agenda.css";
import "./styles/testimonials.css";
import "./styles/pricing.css";
import "./styles/faq.css";
import "./styles/footer.css";

export function LandingPage() {
  useEffect(() => {
    // Navbar scroll effect
    const handleScroll = () => {
      const nav = document.getElementById("navbar");
      if (nav) nav.classList.toggle("nav--scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);

    // Scroll reveal (IntersectionObserver)
    const revealEls = document.querySelectorAll(
      ".reveal, .reveal--left, .reveal--right, .reveal--scale, .reveal-stagger",
    );
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    // Smooth scroll for anchor links
    const handleAnchorClick = function (this: HTMLAnchorElement, e: Event) {
      const href = this.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach((anchor) =>
      anchor.addEventListener("click", handleAnchorClick as EventListener),
    );

    // Agenda animation
    function animateAgenda() {
      const appts = document.querySelectorAll(".agenda-appt");
      const notif = document.querySelector(".agenda-notif");
      if (!appts.length) return;

      let i = 0;
      function showNext() {
        if (i < appts.length) {
          appts[i].classList.add("agenda-appt--visible");
          i++;
          setTimeout(showNext, 600);
        } else if (notif) {
          setTimeout(() => notif.classList.add("agenda-notif--visible"), 400);
          setTimeout(() => {
            notif.classList.remove("agenda-notif--visible");
            appts.forEach((a) => a.classList.remove("agenda-appt--visible"));
            i = 0;
            setTimeout(showNext, 1000);
          }, 4000);
        }
      }

      const agendaObs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            showNext();
            agendaObs.disconnect();
          }
        },
        { threshold: 0.3 },
      );

      const agendaSection = document.getElementById("agenda");
      if (agendaSection) agendaObs.observe(agendaSection);
    }
    animateAgenda();

    // Timeline scroll progress
    function initTimeline() {
      const progress = document.querySelector(
        ".timeline__progress",
      ) as HTMLElement;
      const track = document.querySelector(".timeline__track") as HTMLElement;
      const items = document.querySelectorAll(".timeline__item");
      if (!progress || !track) return;

      const timelineObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("revealed");
          });
        },
        { threshold: 0.4 },
      );

      items.forEach((item) => timelineObs.observe(item));

      const handleTimelineScroll = () => {
        const rect = track.getBoundingClientRect();
        const trackTop = rect.top;
        const trackHeight = rect.height;
        const windowHeight = window.innerHeight;
        const scrolled = Math.max(
          0,
          Math.min(1, (windowHeight * 0.5 - trackTop) / trackHeight),
        );
        progress.style.height = scrolled * 100 + "%";
      };

      window.addEventListener("scroll", handleTimelineScroll);
      return handleTimelineScroll;
    }
    const timelineScrollHandler = initTimeline();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timelineScrollHandler) {
        window.removeEventListener("scroll", timelineScrollHandler);
      }
      anchors.forEach((anchor) =>
        anchor.removeEventListener("click", handleAnchorClick as EventListener),
      );
      revealObserver.disconnect();
    };
  }, []);

  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TimelineSection />
      <AgendaSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <Footer />
    </>
  );
}
