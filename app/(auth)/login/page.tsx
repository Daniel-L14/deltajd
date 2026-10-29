import LoginForm from '@/app/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-rose-900 mb-2">Bienvenido</h1>
        <p className="text-gray-500 mb-6">Ingresa a tu cuenta</p>
        <LoginForm />
      </div>
    </div>
  );
}