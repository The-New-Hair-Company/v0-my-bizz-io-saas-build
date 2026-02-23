import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Upload, Download, MoreVertical, File } from 'lucide-react'
import Link from 'next/link'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's organization
  const { data: membership } = await supabase
    .from('members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  const organizationId = membership?.organization_id

  // Get documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Group documents by type
  const groupedDocs = documents?.reduce((acc: any, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = []
    }
    acc[doc.type].push(doc)
    return acc
  }, {})

  const documentTypes = [
    { value: 'incorporation', label: 'Incorporation', color: 'bg-chart-1' },
    { value: 'bylaws', label: 'Bylaws', color: 'bg-chart-2' },
    { value: 'operating_agreement', label: 'Operating Agreement', color: 'bg-chart-3' },
    { value: 'ein_letter', label: 'EIN Letter', color: 'bg-chart-4' },
    { value: 'filing', label: 'Filing', color: 'bg-chart-5' },
    { value: 'contract', label: 'Contract', color: 'bg-primary' },
    { value: 'other', label: 'Other', color: 'bg-muted-foreground' },
  ]

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage your company documents</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Documents</div>
          <div className="mt-2 text-2xl font-bold">{documents?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Incorporation</div>
          <div className="mt-2 text-2xl font-bold">{groupedDocs?.incorporation?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Filings</div>
          <div className="mt-2 text-2xl font-bold">{groupedDocs?.filing?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Contracts</div>
          <div className="mt-2 text-2xl font-bold">{groupedDocs?.contract?.length || 0}</div>
        </Card>
      </div>

      {/* Document Type Sections */}
      <div className="space-y-6">
        {documentTypes.map((docType) => {
          const typeDocs = groupedDocs?.[docType.value] || []
          if (typeDocs.length === 0) return null

          return (
            <div key={docType.value}>
              <div className="mb-4 flex items-center gap-3">
                <div className={`h-1 w-8 rounded-full ${docType.color}`} />
                <h2 className="text-lg font-semibold">{docType.label}</h2>
                <span className="text-sm text-muted-foreground">({typeDocs.length})</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {typeDocs.map((doc: any) => (
                  <Card key={doc.id} className="p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{doc.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Uploaded {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                          {doc.file_size && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {(doc.file_size / 1024).toFixed(0)} KB
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                    {doc.file_url && (
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={doc.file_url} target="_blank">
                            <Download className="mr-2 h-3 w-3" />
                            Download
                          </Link>
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {!documents || documents.length === 0 ? (
        <Card className="p-12 text-center">
          <File className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">No documents yet</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Upload your first document to get started
          </p>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </Card>
      ) : null}
    </div>
  )
}
