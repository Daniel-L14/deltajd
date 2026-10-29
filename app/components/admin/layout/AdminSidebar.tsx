'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/inventario', label: 'Inventario' },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/pedidos', label: 'Pedidos' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-6">
      <h2 className="text-xl font-bold text-rose-900 mb-8">Frascos & Esencias</h2>
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-4 py-2 rounded-lg transition ${
              pathname === link.href
                ? 'bg-rose-100 text-rose-900 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
