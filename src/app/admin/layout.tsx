export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // No hacer verificación aquí, dejar que la página lo maneje
  // para poder mostrar el formulario de login si no está autenticado
  return (
    <main className="min-h-screen">
      {children}
    </main>
  );
}

