import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import CustomCursor from './components/CustomCursor';
import Preloader from './components/Preloader';
import { DesktopNav, MobileAppBar, TabBar } from './components/Navigation';
import { HeroDesktop, HeroMobile } from './sections/Hero';
import Story from './sections/Story';
import Blackout from './sections/Blackout';
import About from './sections/About';
import Programs from './sections/Programs';
import Services from './sections/Services';
import Store from './sections/Store';
import BackupCalc from './sections/BackupCalc';
import Process from './sections/Process';
import Quote from './sections/Quote';
import Testimonials from './sections/Testimonials';
import Contact from './sections/Contact';
import Footer from './sections/Footer';
import { useIsMobile, useMediaQuery } from './hooks/useMediaQuery';
import { setLenis } from './utils/scroll';

let booted = false; // el preloader solo corre la primera vez por visita

export default function Site() {
  const mobile = useIsMobile();
  const finePointer = useMediaQuery('(pointer: fine)');
  const [loading, setLoading] = useState(!booted);
  const [ready, setReady] = useState(booted);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, prevent: (node) => !!node.closest?.('[data-lenis-prevent]') });
    setLenis(lenis);
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const target = window.location.hash.replace('#', '');
    if (target && !target.startsWith('/')) setTimeout(() => document.getElementById(target)?.scrollIntoView(), 50);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', loading);
  }, [loading]);

  const done = useCallback(() => {
    booted = true;
    setLoading(false);
  }, []);

  return (
    <>
      {finePointer && !mobile && <CustomCursor />}
      <AnimatePresence onExitComplete={() => setReady(true)}>{loading && <Preloader onDone={done} />}</AnimatePresence>

      {mobile ? (
        <>
          <MobileAppBar ready={ready} />
          <TabBar ready={ready} />
        </>
      ) : (
        <DesktopNav ready={ready} />
      )}

      <main className={mobile ? 'is-mobile' : 'is-desktop'}>
        {mobile ? <HeroMobile ready={ready} /> : <HeroDesktop ready={ready} />}
        <Story mobile={mobile} />
        <Blackout mobile={mobile} />
        <About />
        <Programs />
        <Services mobile={mobile} />
        <Store />
        <BackupCalc />
        <Process />
        <Quote />
        <Testimonials />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
