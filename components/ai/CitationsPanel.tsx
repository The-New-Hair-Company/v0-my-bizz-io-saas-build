'use client'

import { FileText, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export type Citation = {
  id: string
  chunk_id: string
  document_id: string
  score: number
  documents?: {
    id: string
    title: string
    mime_type: string
  } | null
}

interface CitationsPanelProps {
  citations: Citation[]
}

export function CitationsPanel({ citations }: CitationsPanelProps) {
  if (citations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
        <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No sources cited yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Upload documents to your vault and the AI will reference them in its answers.
        </p>
      </div>
    )
  }

  // Deduplicate by document_id, keeping highest score
  const byDoc = new Map<string, Citation>()
  citations.forEach((c) => {
    const existing = byDoc.get(c.document_id)
    if (!existing || c.score > existing.score) {
      byDoc.set(c.document_id, c)
    }
  })

  const unique = Array.from(byDoc.values()).sort((a, b) => b.score - a.score)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">Sources</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {unique.length} document{unique.length !== 1 ? 's' : ''} referenced
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {unique.map((citation, idx) => (
            <div
              key={citation.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {citation.documents?.title ?? 'Unknown document'}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {formatMimeType(citation.documents?.mime_type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(citation.score * 100)}% match
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function formatMimeType(mime?: string): string {
  if (!mime) return 'DOC'
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('word') || mime.includes('docx')) return 'DOCX'
  if (mime.includes('csv')) return 'CSV'
  if (mime.includes('text')) return 'TXT'
  return 'DOC'
}
