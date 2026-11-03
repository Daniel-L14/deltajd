// app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server' // Asegúrate de que esta ruta sea correcta

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/tienda' // A dónde ir después de confirmar

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // El correo se verificó. Redirigimos al usuario a la tienda (ya tiene sesión iniciada).
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Si algo falla, redirigimos a una página de error.
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}