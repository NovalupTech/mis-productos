import type { Metadata } from 'next';
import Image from 'next/image';
import styles from './landing.module.css';
import ContactForm from './ContactForm';
import CalendlyButton from './CalendlyButton';
import MobileNav from './MobileNav';
import { StructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Misproductos | Catálogo online personalizable para vender',
  description: 'Crea tu catálogo online, acepta pagos y personaliza la experiencia de tus clientes con Misproductos. Lanzamos tu tienda en 48 horas.',
  keywords: [
    'misproductos',
    'catálogo online',
    'tienda online',
    'ecommerce',
    'vender online',
    'plataforma ecommerce',
    'tienda virtual',
    'catálogo digital',
    'misproductos.shop',
    'subdominios',
    'tienda personalizada',
    'pagos online',
    'catálogo personalizable',
  ],
  authors: [{ name: 'Misproductos' }],
  creator: 'Misproductos',
  publisher: 'Misproductos',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Misproductos | Catálogo online personalizable para vender',
    description: 'Crea tu catálogo online, acepta pagos y personaliza la experiencia de tus clientes con Misproductos. Lanzamos tu tienda en 48 horas.',
    url: 'https://misproductos.shop/',
    siteName: 'Misproductos',
    type: 'website',
    locale: 'es_ES',
    images: [
      {
        url: 'https://misproductos.shop/oc_image.png',
        width: 1200,
        height: 630,
        alt: 'Misproductos - Catálogo online personalizable',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Misproductos | Catálogo online personalizable',
    description: 'Crea tu catálogo online, acepta pagos y personaliza la experiencia de tus clientes con Misproductos.',
    images: ['https://misproductos.shop/oc_image.png'],
  },
  alternates: {
    canonical: 'https://misproductos.shop/',
  },
};

export default function LandingPage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Misproductos',
    url: 'https://misproductos.shop',
    logo: 'https://misproductos.shop/logo.png',
    description: 'Plataforma para crear catálogos online personalizables con pagos integrados',
    sameAs: [
      // Agregar redes sociales si las tienes
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Spanish'],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Misproductos',
    url: 'https://misproductos.shop',
    description: 'Crea tu catálogo online, acepta pagos y personaliza la experiencia de tus clientes con Misproductos',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://misproductos.shop/catalog?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Misproductos',
    applicationCategory: 'ECommerce',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Plataforma para crear catálogos online personalizables con pagos integrados y subdominios personalizados',
  };

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={softwareApplicationSchema} />
      <div style={{ fontFamily: '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif', color: 'var(--color-text)', background: 'var(--color-bg)', lineHeight: '1.6', margin: 0 }}>
      <MobileNav>
        <header className={styles.header} aria-label="Barra de navegación principal">
          <div className={`${styles.container} ${styles.header__bar}`}>
            <a className={styles.logo} href="#top" aria-label="Ir al inicio">
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
              <a href="#caracteristicas">Características</a>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#galeria">Demo/Galería</a>
              <a href="#faq">FAQ</a>
              <CalendlyButton className={`${styles.button} ${styles.buttonPrimary} ${styles.nav__cta}`}>Crear mi catálogo ahora</CalendlyButton>
            </nav>
          </div>
        </header>
      </MobileNav>

      <main id="top">
        <section className={styles.hero}>
          <div className={`${styles.container} ${styles.hero__grid}`}>
            <div className={styles.hero__text}>
              <p className={styles.pill}>Catálogo personalizable</p>
              <h1>Vende por WhatsApp en minutos sin configurar tiendas complejas.</h1>
              <b>Tu catálogo + pagos + contacto listo hoy.</b>
              <p className={styles.lead}>Misproductos: catálogos autoadministrables, precios, categorías y descuentos en segundos, pagos integrados y subdominio para tu empresa. Soporte por whatsapp constante.</p>
              <div className={styles.hero__actions}>
                <CalendlyButton className={`${styles.button} ${styles.buttonPrimary}`}>Crear mi catálogo ahora</CalendlyButton>
                <a className={`${styles.button} ${styles.buttonGhost}`} href="#galeria">Empezá a vender hoy</a>
              </div>
            </div>
            <div className={styles.hero__media}>
              <div className={styles.mockup} role="img" aria-label="Vista previa del catálogo">
                <img src="/landing/dispositivos.jpg" alt="Mockup del catálogo Misproductos" />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.benefits} id="beneficios" aria-label="Beneficios clave">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <h2>Beneficios que aceleran tus ventas</h2>
              <p>Autoadministrable, con pagos integrados y personalización completa.</p>
            </div>
            <div className={styles.grid}>
              <article className={styles.card}>
                <h3>Autoadministrable</h3>
                <p>Actualiza catálogos en minutos sin depender de terceros.</p>
              </article>
              <article className={styles.card}>
                <h3>Pagos integrados</h3>
                <p>Acepta pagos online. Proximamente Mercado Pago.</p>
              </article>
              <article className={styles.card}>
                <h3>Personalización total</h3>
                <p>Logos, banners, temas y orden de productos a tu medida.</p>
              </article>
              <article className={styles.card}>
                <h3>Control de stock</h3>
                <p>Gestiona inventario en tiempo real con alertas automáticas de productos agotados.</p>
              </article>
              <article className={styles.card}>
                <h3>Precios especiales</h3>
                <p>Configura precios diferenciados, descuentos por volumen y ofertas por tiempo limitado.</p>
              </article>
              <article className={styles.card}>
                <h3>Banners promocionales</h3>
                <p>Crea banners rotativos para destacar ofertas, novedades y campañas especiales.</p>
              </article>
              <article className={styles.card}>
                <h3>Productos destacados</h3>
                <p>Destaca tus productos más importantes para aumentar su visibilidad y ventas.</p>
              </article>
              <article className={styles.card}>
                <h3>Integraciones API</h3>
                <p>Si ya tenes un programador o un sistema propio, podemos ayudarte a integrar tu catalogo.</p>
              </article>
              <article className={styles.card}>
                <h3>Permanente asistencia</h3>
                <p>Asistencia permanente por whatsapp para guiarte en la configuración y resolución de problemas.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.features} id="caracteristicas">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <p className={styles.pill}>Todo lo que necesitas</p>
              <h2>Características detalladas</h2>
            </div>
            <div className={styles.grid}>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">🛒</div>
                <div>
                  <h3>ABM de productos</h3>
                  <p>Alta, baja y modificación con variantes, stock y visibilidad.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">🏷️</div>
                <div>
                  <h3>Categorías y filtros</h3>
                  <p>Navegación clara con filtros personalizados.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">💳</div>
                <div>
                  <h3>Precios y cupones</h3>
                  <p>Descuentos, cupones y listas de precios por segmento.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">🎨</div>
                <div>
                  <h3>Apariencia configurable</h3>
                  <p>Temas, logos, banners y orden de productos editable.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">🖼️</div>
                <div>
                  <h3>Banners rotativos</h3>
                  <p>Imágenes con links para campañas y anuncios.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">🔗</div>
                <div>
                  <h3>Integraciones de pago</h3>
                  <p>Stripe listo para cobrar. Proximamente Mercado Pago.</p>
                  {/* <div className={styles.payments}>
                    <img src="https://via.placeholder.com/110x40.png?text=Mercado+Pago" alt="Logo Mercado Pago" />
                    <img src="https://via.placeholder.com/90x40.png?text=Stripe" alt="Logo Stripe" />
                  </div> */}
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">⬇️</div>
                <div>
                  <h3>Exportar/Importar CSV</h3>
                  <p>Migrá o respalda catálogos en segundos.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">🌐</div>
                <div>
                  <h3>Dominios y subdominios</h3>
                  <p>cliente.misproductos.shop o dominio propio con DNS asistido.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">📊</div>
                <div>
                  <h3>Control de stock</h3>
                  <p>Gestión de inventario en tiempo real con alertas de productos agotados.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">⭐</div>
                <div>
                  <h3>Destacar productos</h3>
                  <p>Marca productos como destacados para aparecer en secciones especiales.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">💰</div>
                <div>
                  <h3>Precios especiales</h3>
                  <p>Configura precios diferenciados por cliente, descuentos por cantidad y ofertas temporales.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">🎯</div>
                <div>
                  <h3>Banners personalizados</h3>
                  <p>Crea y gestiona banners rotativos con imágenes y enlaces para promociones.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardFeature}`}>
                <div className={styles.icon} aria-hidden="true">🔌</div>
                <div>
                  <h3>API REST</h3>
                  <p>Si ya tenes un programador o un sistema propio, podemos ayudarte a integrar tu catalogo.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.steps} id="como-funciona">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <h2>¿Cómo funciona?</h2>
              <p>Configura → Publica → Vende</p>
            </div>
            <div className={styles.grid}>
              <article className={`${styles.card} ${styles.cardStep}`}>
                <div className={styles.icon} aria-hidden="true">🧭</div>
                <div>
                  <h3>Crear tu cuenta y elegir plantilla</h3>
                  <p>Elige un tema base y activa tu catálogo en minutos.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardStep}`}>
                <div className={styles.icon} aria-hidden="true">📦</div>
                <div>
                  <h3>Subir productos y personalizar</h3>
                  <p>Carga fotos, precios, variantes y banners con tu marca.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardStep}`}>
                <div className={styles.icon} aria-hidden="true">🚀</div>
                <div>
                  <h3>Compartir y vender</h3>
                  <p>Usa un subdominio o conecta tu dominio propio.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.gallery} id="galeria">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <h2>Demo y ejemplos</h2>
              <p>Catálogos reales para cursos, productos y servicios.</p>
            </div>
            <div className={styles.grid}>
              <article className={`${styles.card} ${styles.cardGallery}`}>
                <img src="/landing/pasteleria.png" alt="Ejemplo catálogo Pastelería" />
                <div>
                  <h3>Pastelería — catálogo</h3>
                  <p>Pedidos personalizados con entregas programadas.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardGallery}`}>
                <img src="/landing/tecnologia.png" alt="Ejemplo catálogo Tecnologia" />
                <div>
                  <h3>Tecnologia — productos</h3>
                  <p>Productos tecnológicos y accesorios.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardGallery}`}>
                <img src="/landing/indumentaria.png" alt="Ejemplo catálogo Indumentaria" />
                <div>
                  <h3>Indumentaria — ecommerce ligero</h3>
                  <p>Variantes por color/talle y cupones.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardGallery}`}>
                <img src="/landing/cursos.png" alt="Ejemplo catálogo Cursos online" />
                <div>
                  <h3>Cursos online</h3>
                  <p>Landing de cursos con pagos integrados.</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardGallery}`}>
                <img src="/landing/libros.png" alt="Ejemplo catálogo Libros" />
                <div>
                  <h3>Catalogo de libros</h3>
                  <p>Catalogo de libros con pagos integrados.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* <section className={styles.testimonials} id="testimonios">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <h2>Testimonios</h2>
              <p>Clientes que ya venden con Misproductos.</p>
            </div>
            <div className={styles.grid}>
              <article className={`${styles.card} ${styles.cardTestimonial}`}>
                <img src="https://via.placeholder.com/64.png?text=Foto" alt="Foto de Ana" />
                <div>
                  <p className={styles.quote}>"Lancé mi catálogo en dos días y cobro sin problemasq."</p>
                  <p className={styles.author}>Ana — Pastelería artesanal</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardTestimonial}`}>
                <img src="https://via.placeholder.com/64.png?text=Foto" alt="Foto de Marcos" />
                <div>
                  <p className={styles.quote}>"Pude crear subdominios para mis clientes en minutos. Muy fácil de gestionar."</p>
                  <p className={styles.author}>Marcos — Agencia digital</p>
                </div>
              </article>
              <article className={`${styles.card} ${styles.cardTestimonial}`}>
                <img src="https://via.placeholder.com/64.png?text=Foto" alt="Foto de Lucía" />
                <div>
                  <p className={styles.quote}>"El equipo me ayudó con el dominio propio y quedé online en 48h."</p>
                  <p className={styles.author}>Lucía — Escuela de Yoga</p>
                </div>
              </article>
            </div>
          </div>
        </section> */}

        <section className={styles.faq} id="faq">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <h2>Preguntas frecuentes</h2>
              <p>Todo lo esencial para empezar.</p>
            </div>
            <div className={styles.faq__list}>
              <details open>
                <summary>¿Puedo usar mi propio dominio?</summary>
                <p>Sí. Configuramos DNS contigo para tu dominio o usamos cliente.misproductos.shop.</p>
              </details>
              <details open>
                <summary>¿Se cobran comisiones por venta?</summary>
                <p>Solo las comisiones del proveedor de pago (ej. Stripe). No cobramos comisión por ítem.</p>
              </details>
              <details open>
                <summary>¿Tienen soporte?</summary>
                <p>Soporte por whatsapp y onboarding en 48h para lanzar tu catálogo.</p>
              </details>
              <details open>
                <summary>¿Puedo cambiar la apariencia del catálogo?</summary>
                <p>Sí. Temas, logos, banners, orden y estilos de tarjetas son configurables.</p>
              </details>
              <details open>
                <summary>¿Cómo funcionan los banners promocionales?</summary>
                <p>Puedes crear banners rotativos con imágenes y enlaces personalizados. Se muestran en la parte superior del catálogo y puedes configurar múltiples banners que rotan automáticamente.</p>
              </details>
              <details open>
                <summary>¿Puedo configurar precios especiales o descuentos?</summary>
                <p>Sí. Puedes crear descuentos por porcentaje o monto fijo, cupones de descuento, precios especiales por cliente y ofertas temporales con fechas de inicio y fin.</p>
              </details>
              <details open>
                <summary>¿Cómo destaco productos importantes?</summary>
                <p>Puedes marcar productos como "destacados" y aparecerán en secciones especiales del catálogo, aumentando su visibilidad para tus clientes.</p>
              </details>
              <details open>
                <summary>¿Tienen control de stock?</summary>
                <p>Sí. El sistema gestiona el inventario en tiempo real, muestra alertas cuando los productos se agotan y puedes configurar notificaciones automáticas.</p>
              </details>
              <details open>
                <summary>¿Ofrecen integraciones por API?</summary>
                <p>Sí. Disponemos de API REST completa que te permite sincronizar productos, categorías, stock y pedidos con otros sistemas como ERPs, sistemas de inventario o plataformas de gestión.</p>
              </details>
              <details open>
                <summary>¿Puedo importar productos masivamente?</summary>
                <p>Sí. Puedes importar productos desde archivos CSV, lo que te permite cargar grandes catálogos de forma rápida y eficiente.</p>
              </details>
              <details open>
                <summary>¿Qué métodos de pago aceptan?</summary>
                <p>Actualmente Stripe está disponible. Próximamente agregaremos Mercado Pago y otros métodos de pago populares en Argentina.</p>
              </details>
              <details open>
                <summary>¿Puedo personalizar los banners con mi marca?</summary>
                <p>Sí. Los banners son completamente personalizables: puedes subir tus propias imágenes, agregar enlaces a productos específicos o páginas externas, y configurar el orden de rotación.</p>
              </details>
              <details open>
                <summary>¿Necesito tener tienda física?</summary>
                <p>No es necesario. Misproductos está diseñado para vender online, por lo que puedes operar completamente digital. Muchos de nuestros clientes venden desde casa, tienen almacenes o trabajan con dropshipping.</p>
              </details>
              <details open>
                <summary>¿Puedo vender por WhatsApp también?</summary>
                <p>Sí. El catálogo está optimizado para compartir por WhatsApp. Tus clientes pueden ver productos, precios y hacer pedidos directamente desde el enlace que compartas. Además, puedes integrar el botón de WhatsApp en cada producto para contacto directo.</p>
              </details>
              <details open>
                <summary>¿Cuánto tarda en estar online mi catálogo?</summary>
                <p>Tu catálogo puede estar online en 48 horas. Incluye configuración inicial, onboarding personalizado y soporte para que puedas empezar a vender rápidamente.</p>
              </details>
              <details open>
                <summary>¿Puedo cambiar luego de plan?</summary>
                <p>Sí, puedes cambiar de plan en cualquier momento. Si necesitas más funcionalidades o quieres reducir tu plan, puedes hacerlo desde tu panel de administración sin perder tus datos ni productos.</p>
              </details>
            </div>
          </div>
        </section>

        <section className={styles.cta} id="cta-final">
          <div className={`${styles.container} ${styles.cta__box}`}>
            <div>
              <h2>Agendá una reunión y empezá a vender hoy</h2>
              <p>¿Listo para vender? Hacemos todo en 48h.</p>
            </div>
            <div className={styles.cta__actions}>
              <CalendlyButton className={`${styles.button} ${styles.buttonPrimary}`}>Crear mi catálogo ahora</CalendlyButton>
              <a className={`${styles.button} ${styles.buttonGhost}`} target="_blank" rel="noopener noreferrer" href="https://wa.me/5491163717386?text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20Misproductos">Empezá a vender hoy</a>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer} aria-label="Pie de página">
        <div className={`${styles.container} ${styles.footer__content}`}>
          <p>© 2025 Misproductos. Todos los derechos reservados.</p>
          <a className={`${styles.button} ${styles.buttonGhost}`} href="#top">Volver arriba</a>
        </div>
      </footer>

      <a
        href="https://wa.me/5491163717386?text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20Misproductos"
        className={styles.whatsappFloat}
        aria-label="Contactar por WhatsApp"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg className={styles.whatsappIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span className={styles.whatsappTooltip}>¿Necesitas ayuda? Escríbenos</span>
      </a>
      </div>
    </>
  );
}
