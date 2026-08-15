import { redirect } from 'next/navigation'
import { ChatLayout } from '@/components/ai/ChatLayout'
import { requirePortalUser } from '@/lib/portal/auth'
import { getActiveOrganization } from '@/lib/portal/context'

export const metadata = {
  title: 'AI Cofounder — MyBizz',
  description: 'A grounded strategic thinking partner for priorities, delivery, positioning and growth decisions.',
}

export default async function CofounderPage() {
  const user = await requirePortalUser()
  const membership = await getActiveOrganization(user.userId)

  if (!membership) redirect('/dashboard')

  return (
    <ChatLayout
      agentType="cofounder"
      organizationId={membership.organization_id}
    />
  )
}
