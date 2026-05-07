import { useEffect } from 'react';
import '@/styles/landing/landing.scss';
import Navbar from '@/components/Landing/Navbar/Navbar';
import Hero from '@/components/Landing/Hero/Hero';
import LogosStrip from '@/components/Landing/LogosStrip/LogosStrip';
import HowItWorks from '@/components/Landing/HowItWorks/HowItWorks';
import Features from '@/components/Landing/Features/Features';
import Timeline from '@/components/Landing/Timeline/Timeline';
import AgendaSection from '@/components/Landing/AgendaSection/AgendaSection';
import ForWho from '@/components/Landing/ForWho/ForWho';
import Differentials from '@/components/Landing/Differentials/Differentials';
import Testimonials from '@/components/Landing/Testimonials/Testimonials';
import Pricing from '@/components/Landing/Pricing/Pricing';
import FAQ from '@/components/Landing/FAQ/FAQ';
import Footer from '@/components/Landing/Footer/Footer';

export function LandingPage() {
  // Apply landing-specific body overrides that can't be on a wrapper div
  // (overflow-x:hidden on a div breaks position:sticky, but on body it's fine)
  useEffect(() => {
    document.body.classList.add('is-landing');
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.body.classList.remove('is-landing');
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      <main id="main-content">
        <Hero />
        <LogosStrip />
        <HowItWorks />
        <AgendaSection />
        <Timeline />
        <Features />
        <ForWho />
        <Differentials />
        <Pricing />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
