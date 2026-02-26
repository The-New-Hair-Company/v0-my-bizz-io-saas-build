import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatLayout } from '@/components/ai/ChatLayout'

export const metadata = {
  title: 'AI Cofounder — MyBizz',
  description: 'Your AI strategic thinking partner: strategy, fundraising, GTM, and more.',
}

export default async function CofounderPage() {
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
      agentType="cofounder"
      organizationId={membership.organization_id}
    />
  )
}
