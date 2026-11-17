import Link from "next/link";
export default function Page() {
  return (
    <main className="p-10 text-center space-y-5">
      <h1 className="text-2xl">No pudimos confirmar el enlace</h1>
      <p>
        Puede haber caducado o haberse usado. Inicia sesión o solicita otro
        enlace desde la recuperación de contraseña.
      </p>
      <Link href="/login">Volver a iniciar sesión</Link>
    </main>
  );
}
