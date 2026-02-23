import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function CompanyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's organization
  const { data: membership } = await supabase
    .from('members')
    .select('organization_id, role, organizations(*)')
    .eq('user_id', user.id)
    .single()

  const organization = membership?.organizations

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-muted-foreground">View and manage your company information</p>
      </div>

      {/* Company Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Company Name</dt>
              <dd className="mt-1 text-sm">{organization?.name || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Entity Type</dt>
              <dd className="mt-1 text-sm">{organization?.entity_type || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">EIN</dt>
              <dd className="mt-1 text-sm">{organization?.ein || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">State of Incorporation</dt>
              <dd className="mt-1 text-sm">{organization?.state_of_incorporation || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Incorporation Date</dt>
              <dd className="mt-1 text-sm">
                {organization?.incorporation_date
                  ? new Date(organization.incorporation_date).toLocaleDateString()
                  : 'Not provided'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Contact Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Address</dt>
              <dd className="mt-1 text-sm">
                {organization?.address_line1 ? (
                  <>
                    <div>{organization.address_line1}</div>
                    {organization.address_line2 && <div>{organization.address_line2}</div>}
                    <div>
                      {organization.city && `${organization.city}, `}
                      {organization.state && `${organization.state} `}
                      {organization.postal_code}
                    </div>
                    {organization.country && <div>{organization.country}</div>}
                  </>
                ) : (
                  'Not provided'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
              <dd className="mt-1 text-sm">{organization?.phone || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Website</dt>
              <dd className="mt-1 text-sm">
                {organization?.website ? (
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {organization.website}
                  </a>
                ) : (
                  'Not provided'
                )}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Role Badge */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Your Access</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Role:</span>
          <Badge>{membership?.role}</Badge>
        </div>
      </Card>
    </div>
  )
}
