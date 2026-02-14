'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/airtime-orders', label: 'Airtime Orders', icon: '📱' },
  { href: '/admin/products', label: 'Products', icon: '🏷️' },
  { href: '/admin/events', label: 'Events', icon: '🎟️' },
  { href: '/admin/ticket-orders', label: 'Ticket Orders', icon: '🧾' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
]

export default function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <Link href="/admin" className="text-2xl font-bold text-emerald-400">
          Shoppy Admin
        </Link>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      
      <div className="border-t border-gray-700 pt-4 mt-4">
        <Link 
          href="/" 
          className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="text-xl">🏪</span>
          <span>View Store</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
