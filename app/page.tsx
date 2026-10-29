export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-white p-8">
      <h1 className="text-5xl font-bold text-rose-900 mb-4">Frascos & Esencias</h1>
      <p className="text-lg text-gray-600 mb-8">Perfumería artesanal</p>
      <div className="flex gap-4">
        <a href="/tienda" className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition">
          Ir a la Tienda
        </a>
        <a href="/login" className="px-6 py-3 border border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition">
          Iniciar Sesión
        </a>
      </div>
    </main>
  );
}
