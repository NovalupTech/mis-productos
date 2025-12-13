'use client';

import { useEffect } from 'react';
import styles from './landing.module.css';

export default function MobileNav({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const nav = document.querySelector(`.${styles.nav}`);
    const navToggle = document.getElementById('nav-toggle') as HTMLInputElement;

    const handleNavClick = (e: Event) => {
      const target = e.target as HTMLElement;
      // Cerrar el menú si se hace clic en cualquier enlace o botón dentro del nav
      if (target.tagName === 'A' || target.closest('a') || target.closest('button')) {
        if (navToggle) {
          navToggle.checked = false;
        }
      }
    };

    if (nav) {
      nav.addEventListener('click', handleNavClick);
    }

    return () => {
      if (nav) {
        nav.removeEventListener('click', handleNavClick);
      }
    };
  }, []);

  return <>{children}</>;
}
