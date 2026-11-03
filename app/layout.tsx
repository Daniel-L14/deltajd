import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/app/context/CartContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DELTA Perfumería | Alta Gama & Esencias Exclusivas',
  description: 'Descubre fragancias artesanales de autor, extractos de perfume altamente concentrados e ingredientes finos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${inter.className} bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-amber-500 selection:text-slate-950`}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}