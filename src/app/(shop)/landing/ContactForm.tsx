'use client';

import { useEffect, useState } from 'react';
import styles from './landing.module.css';

export default function ContactForm() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <form className={styles.form} aria-label="Formulario de contacto">
        <label>
          Nombre
          <input type="text" name="nombre" placeholder="Tu nombre" required disabled />
        </label>
        <label>
          Email
          <input type="email" name="email" placeholder="tu@email.com" required disabled />
        </label>
        <label>
          Mensaje
          <textarea name="mensaje" rows={4} placeholder="Cuéntanos sobre tu catálogo" required disabled></textarea>
        </label>
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit" disabled>
          Enviar mensaje
        </button>
      </form>
    );
  }

  return (
    <form className={styles.form} action="mailto:desarrollos@novaluptech.com" method="post" encType="text/plain" suppressHydrationWarning>
      <label>
        Nombre
        <input type="text" name="nombre" placeholder="Tu nombre" required />
      </label>
      <label>
        Email
        <input type="email" name="email" placeholder="tu@email.com" required />
      </label>
      <label>
        Mensaje
        <textarea name="mensaje" rows={4} placeholder="Cuéntanos sobre tu catálogo" required></textarea>
      </label>
      <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit">
        Enviar mensaje
      </button>
    </form>
  );
}
