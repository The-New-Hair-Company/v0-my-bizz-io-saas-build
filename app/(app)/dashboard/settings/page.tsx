import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Account Settings */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Account</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="mt-1 text-sm">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
            <dd className="mt-1 font-mono text-xs text-muted-foreground">{user.id}</dd>
          </div>
        </dl>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Notification preferences will be available in a future update.
        </p>
      </Card>

      {/* Security Settings */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">
          Password and security settings will be available in a future update.
        </p>
      </Card>
    </div>
  )
}
