import { requirePortalUser } from '@/lib/portal/auth'
import { redirect } from 'next/navigation'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalUser()
  if (!user.isAdmin) redirect('/dashboard')
  return children
}
