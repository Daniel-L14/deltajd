import Navbar from '@/app/components/layout/Navbar';
import CatalogView from '@/app/components/catalog/CatalogView';

export default function CatalogoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CatalogView />
      </main>
    </div>
  );
}