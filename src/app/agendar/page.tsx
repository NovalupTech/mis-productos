'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import styles from '../landing/landing.module.css';
import MobileNav from '../landing/MobileNav';

// Estilos para el widget de Calendly
const calendlyStyles = `
  #calendly-container {
    position: relative;
  }
  #calendly-container .calendly-inline-widget {
    min-height: 1000px !important;
    height: auto !important;
  }
  #calendly-container iframe {
    height: 1000px !important;
    min-height: 1000px !important;
  }
`;

export default function AgendarPage() {
  useEffect(() => {
    const initCalendly = () => {
      const calendlyContainer = document.getElementById('calendly-container');
      if (calendlyContainer && typeof window !== 'undefined' && (window as any).Calendly) {
        const Calendly = (window as any).Calendly;
        if (Calendly.initInlineWidget) {
          Calendly.initInlineWidget({
            url: 'https://calendly.com/desarrollo-novalup/reunion-misproductos',
            parentElement: calendlyContainer,
          });
        }
      }
    };

    // Cargar el CSS de Calendly si no está cargado
    const existingLink = document.querySelector('link[href="https://assets.calendly.com/assets/external/widget.css"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Verificar si Calendly ya está disponible
    if (typeof window !== 'undefined' && (window as any).Calendly) {
      initCalendly();
      return;
    }

    // Cargar el script de Calendly si no está cargado
    const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        // Esperar un momento para asegurar que Calendly esté completamente inicializado
        setTimeout(initCalendly, 100);
      };
      document.body.appendChild(script);
    } else {
      // Si el script ya existe pero Calendly aún no está disponible, esperar
      const checkCalendly = setInterval(() => {
        if (typeof window !== 'undefined' && (window as any).Calendly) {
          clearInterval(checkCalendly);
          initCalendly();
        }
      }, 100);

      // Limpiar el intervalo después de 10 segundos
      setTimeout(() => clearInterval(checkCalendly), 10000);
    }
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: calendlyStyles }} />
      <div style={{ fontFamily: '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif', color: 'var(--color-text)', background: 'var(--color-bg)', lineHeight: '1.6', margin: 0, minHeight: '100vh' }}>
        <MobileNav>
          <header className={styles.header} aria-label="Barra de navegación principal">
          <div className={`${styles.container} ${styles.header__bar}`}>
            <a className={styles.logo} href="/landing" aria-label="Ir al inicio">
              <Image
                src="/logo.png"
                alt="Misproductos logo"
                width={120}
                height={40}
                className={styles.logo__icon}
                priority
              />
              <span className={styles.logo__text}>Misproductos</span>
            </a>
            <input type="checkbox" id="nav-toggle" className={styles.navToggle} aria-label="Abrir menú" />
            <label htmlFor="nav-toggle" className={styles.navToggle__label} aria-hidden="true">
              <span></span><span></span><span></span>
            </label>
            <nav className={styles.nav}>
              <a href="/landing#caracteristicas">Características</a>
              <a href="/landing#como-funciona">Cómo funciona</a>
              <a href="/landing#galeria">Demo/Galería</a>
              <a href="/landing#faq">FAQ</a>
            </nav>
          </div>
          </header>
        </MobileNav>

      <main style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <section className={styles.container} style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>
              Agenda una reunión
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--color-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Selecciona un horario que te funcione y empecemos a crear tu catálogo online
            </p>
          </div>
          
          <div 
            id="calendly-container" 
            style={{ 
              width: '100%',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              background: 'var(--color-surface)',
              position: 'relative'
            }}
          />
        </section>
      </main>

      <footer className={styles.footer} aria-label="Pie de página">
        <div className={`${styles.container} ${styles.footer__content}`}>
          <p>© 2025 Misproductos. Todos los derechos reservados.</p>
          <a className={`${styles.button} ${styles.buttonGhost}`} href="/landing">Volver al inicio</a>
        </div>
      </footer>
      </div>
    </>
  );
}
