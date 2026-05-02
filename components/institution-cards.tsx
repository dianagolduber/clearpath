'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Institution, MemorialItem } from '@/lib/types'
import { Textarea } from '@/components/ui/textarea'

interface InstitutionCardsProps {
  institutions: Institution[]
  memorialItems: MemorialItem[]
  onVerify: (institutionName: string, index: number) => Promise<{ refinedLetter: string; sources: string[] }>
  onStartOver: () => void
}

const MEMORIAL_LABELS: Record<MemorialItem['type'], string> = {
  funeral_home: 'Funeral Home Notification',
  obituary: 'Obituary Draft',
  eulogy_opening: 'Eulogy Opening',
}

function MemorialCard({ item }: { item: MemorialItem }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copyText, setCopyText] = useState('Copy')
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(item.content)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      setCopyText('Copied!')
      setTimeout(() => setCopyText('Copy'), 2000)
    } catch {
      setCopyText('Copy Failed')
      setTimeout(() => setCopyText('Copy'), 2000)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CardTitle className="font-serif text-xl text-foreground">
                {item.title}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe] font-medium">
              Memorial
            </Badge>
            <span className="text-sm text-muted-foreground whitespace-nowrap">When ready</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {isOpen ? 'Hide' : 'View'}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {isEditing ? (
              <div>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-80 font-mono text-sm"
                />
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="default">
                    Save Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setEditedContent(item.content)
                      setIsEditing(false)
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white border border-border rounded-lg p-4 sm:p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                    {editedContent}
                  </pre>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={handleCopy}>
                    {copyText}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

function UrgencyBadge({ urgency }: { urgency: Institution['urgency'] }) {
  const variants = {
    urgent: 'bg-primary text-primary-foreground',
    soon: 'bg-amber-600 text-white',
    later: 'bg-muted text-muted-foreground',
  }
  
  const labels = {
    urgent: 'Urgent',
    soon: 'Soon',
    later: 'When Ready',
  }

  return (
    <Badge className={`${variants[urgency]} font-medium`}>
      {labels[urgency]}
    </Badge>
  )
}

function InstitutionCard({ 
  institution, 
  index, 
  sent,
  onVerify,
  onMarkSent,
}: { 
  institution: Institution & { verified?: boolean }
  index: number
  sent: boolean
  onVerify: (institutionName: string, index: number) => Promise<{ refinedLetter: string; sources: string[] }>
  onMarkSent: (index: number) => void
}) {
  const [isLetterOpen, setIsLetterOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [sources, setSources] = useState<string[]>([])
  const [copyText, setCopyText] = useState('Copy Letter')
  const [isEditing, setIsEditing] = useState(false)
  const [editedLetter, setEditedLetter] = useState(institution.letter)

  const handleVerify = async () => {
    setIsVerifying(true)
    setVerifyError(null)
    try {
      const result = await onVerify(institution.name, index)
      setSources(result.sources || [])
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCopyLetter = async () => {
    try {
      await navigator.clipboard.writeText(editedLetter)
      setCopyText('Copied!')
      setTimeout(() => setCopyText('Copy Letter'), 2000)
    } catch (err) {
      console.error('Failed to copy letter:', err)
      setCopyText('Copy Failed')
      setTimeout(() => setCopyText('Copy Letter'), 2000)
    }
  }

  return (
    <Card className={`bg-card border-border transition-opacity ${sent ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CardTitle className="font-serif text-xl text-foreground">
                {institution.name}
              </CardTitle>
              {institution.verified && (
                <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Verified with current law" />
              )}
              {sent && (
                <Badge className="bg-green-100 text-green-800 border border-green-200 font-medium">
                  Sent ✓
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{institution.category}</p>
          </div>
          <div className="flex items-center gap-2">
            {!sent && <UrgencyBadge urgency={institution.urgency} />}
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {institution.deadlineDays} days
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-foreground">{institution.reasonForDeadline}</p>
        
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Documents Needed:</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            {institution.evidenceNeeded.map((doc, i) => (
              <li key={i}>{doc}</li>
            ))}
          </ul>
        </div>

        <Collapsible open={isLetterOpen} onOpenChange={setIsLetterOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {isLetterOpen ? 'Hide Letter' : 'View Letter'}
              {isLetterOpen ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {isEditing ? (
              <div>
                <Textarea
                  value={editedLetter}
                  onChange={(e) => setEditedLetter(e.target.value)}
                  className="min-h-80 font-mono text-sm"
                />
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="default">
                    Save Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setEditedLetter(institution.letter)
                      setIsEditing(false)
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white border border-border rounded-lg p-4 sm:p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                    {editedLetter}
                  </pre>
                </div>
                
                <div className="mt-4 flex flex-col sm:flex-row gap-2 flex-wrap">
                  <Button
                    onClick={handleVerify}
                    disabled={isVerifying || institution.verified}
                    variant={institution.verified ? 'outline' : 'default'}
                    className="flex-1 sm:flex-none"
                  >
                    {isVerifying ? (
                      <>
                        <Spinner className="mr-2" />
                        Verifying...
                      </>
                    ) : institution.verified ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Verified
                      </>
                    ) : (
                      'Verify with Current Law'
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleCopyLetter}
                    className="flex-1 sm:flex-none"
                  >
                    {copyText}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 sm:flex-none"
                  >
                    Edit Letter
                  </Button>

                  {!sent && (
                    <Button
                      variant="outline"
                      onClick={() => onMarkSent(index)}
                      className="flex-1 sm:flex-none border-green-300 text-green-800 hover:bg-green-50"
                    >
                      Mark as sent
                    </Button>
                  )}
                </div>
                
                {verifyError && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {verifyError}
                  </div>
                )}
                
                {sources.length > 0 && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Sources Used:</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {sources.map((source, i) => (
                        <li key={i} className="truncate">{source}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

export function InstitutionCards({ institutions, memorialItems, onVerify, onStartOver }: InstitutionCardsProps) {
  const [sentIndices, setSentIndices] = useState<Set<number>>(new Set())

  const handleMarkSent = (index: number) => {
    setSentIndices(prev => new Set(prev).add(index))
  }

  // Split into unsent (original order) and sent (appended at bottom)
  const unsent = institutions
    .map((inst, i) => ({ inst, i }))
    .filter(({ i }) => !sentIndices.has(i))

  const sent = institutions
    .map((inst, i) => ({ inst, i }))
    .filter(({ i }) => sentIndices.has(i))

  const ordered = [...unsent, ...sent]
  const sentCount = sentIndices.size
  const remaining = institutions.length - sentCount

  const total = institutions.length
  const progressPct = total > 0 ? (sentCount / total) * 100 : 0

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-1">
            Your Action Items
          </h2>
        </div>
        <Button variant="outline" onClick={onStartOver}>
          Start Over
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{sentCount} of {total}</span> notifications sent
          </span>
          <span className="text-sm text-muted-foreground">{remaining} remaining</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              backgroundColor: 'var(--color-primary)',
            }}
            role="progressbar"
            aria-valuenow={sentCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${sentCount} of ${total} notifications sent`}
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {ordered.map(({ inst, i }) => (
          <InstitutionCard
            key={`${inst.name}-${i}`}
            institution={inst}
            index={i}
            sent={sentIndices.has(i)}
            onVerify={onVerify}
            onMarkSent={handleMarkSent}
          />
        ))}
      </div>

      {memorialItems.length > 0 && (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-1">Memorial Materials</h2>
            <p className="text-muted-foreground text-sm">Drafts to help you honor your loved one — complete when you are ready.</p>
          </div>
          <div className="flex flex-col gap-4">
            {memorialItems.map((item) => (
              <MemorialCard key={item.type} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
