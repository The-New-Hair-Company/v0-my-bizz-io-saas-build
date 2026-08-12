import { redirect } from 'next/navigation'
import { ChatLayout } from '@/components/ai/ChatLayout'
import { requirePortalUser } from '@/lib/portal/auth'
import { getActiveOrganization } from '@/lib/portal/context'

export const metadata = {
  title: 'AI Cofounder — MyBizz',
  description: 'Your AI strategic thinking partner: strategy, fundraising, GTM, and more.',
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
