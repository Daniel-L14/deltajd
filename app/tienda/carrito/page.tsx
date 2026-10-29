export default function CarritoPage() {
  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Carrito</h1>
        <p className="text-gray-600">TODO: listar items y total</p>
        <a
          href="/tienda/checkout"
          className="inline-block mt-6 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
        >
          Ir a pagar
        </a>
      </div>
    </main>
  );
}
