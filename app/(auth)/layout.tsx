export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">{children}</div>
    </div>
  );
}
