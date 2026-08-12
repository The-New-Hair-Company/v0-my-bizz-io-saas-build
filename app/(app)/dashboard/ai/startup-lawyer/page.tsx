import { redirect } from 'next/navigation'
import { ChatLayout } from '@/components/ai/ChatLayout'
import { requirePortalUser } from '@/lib/portal/auth'
import { getActiveOrganization } from '@/lib/portal/context'

export const metadata = {
  title: 'AI Startup Lawyer — MyBizz',
  description: 'AI-powered legal guidance for startups: incorporation, compliance, contracts, and more.',
}

export default async function StartupLawyerPage() {
  const user = await requirePortalUser()
  const membership = await getActiveOrganization(user.userId)

  if (!membership) redirect('/dashboard')

  return (
    <ChatLayout
      agentType="startup_lawyer"
      organizationId={membership.organization_id}
    />
  )
}
