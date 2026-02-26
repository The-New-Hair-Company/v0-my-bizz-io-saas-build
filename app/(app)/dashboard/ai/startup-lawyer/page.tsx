import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatLayout } from '@/components/ai/ChatLayout'

export const metadata = {
  title: 'AI Startup Lawyer — MyBizz',
  description: 'AI-powered legal guidance for startups: incorporation, compliance, contracts, and more.',
}

export default async function StartupLawyerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/login')

  return (
    <ChatLayout
      agentType="startup_lawyer"
      organizationId={membership.organization_id}
    />
  )
}
