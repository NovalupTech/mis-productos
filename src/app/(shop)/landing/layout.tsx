import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Misproductos | Catálogo online personalizable para vender',
  description: 'Crea tu catálogo online, acepta pagos y personaliza la experiencia de tus clientes con Misproductos. Lanzamos tu tienda en 48 horas.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
