import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/admin/Sidebar'

export const metadata = {
  title: 'Admin Dashboard - Shoppy',
}

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)
  
  // Allow access to login page without auth
  // The actual protection happens in page components
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      {session && <Sidebar />}
      <main className={`flex-1 ${session ? 'p-8' : ''}`}>
        {children}
      </main>
    </div>
  )
}
