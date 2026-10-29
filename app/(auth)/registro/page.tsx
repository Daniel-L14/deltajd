import RegistroForm from '@/app/components/auth/RegistroForm';

export default function RegistroPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-rose-900 mb-2">Crear cuenta</h1>
      <p className="text-gray-500 mb-6">Únete a Frascos & Esencias</p>
      <RegistroForm />
    </div>
  );
}
