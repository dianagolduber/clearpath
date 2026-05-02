'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, User, X, Send, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import type { Institution, MemorialItem } from '@/lib/types'
import { Textarea } from '@/components/ui/textarea'

interface InstitutionCardsProps {
  institutions: Institution[]
  memorialItems: MemorialItem[]
  onVerify: (institutionName: string, index: number) => Promise<{ refinedLetter: string; sources: string[] }>
  onStartOver: () => void
  deceasedName: string
}

const MEMORIAL_LABELS: Record<MemorialItem['type'], string> = {
  funeral_home: 'Funeral Home Notification',
  obituary: 'Obituary Draft',
  eulogy_opening: 'Eulogy Opening',
}

// Skeleton loading cards shown while waiting
export function SkeletonCards() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const FUNERAL_CHECKLIST_ITEMS = [
  'Choose funeral home',
  'Decide burial vs cremation',
  'Set date and time of service',
  'Notify close family and friends',
  'Write and submit obituary',
  'Choose flowers and music',
  'Arrange transportation',
  'Plan reception/gathering',
  'Thank you notes to attendees',
  'Order death certificates (get 10+ copies)',
]

// ── Per-card assignee section ──────────────────────────────────────────────
// Each card manages its own list of assignees inline — no global panel needed.
function AssignSection({
  assignees,
  onAdd,
  onRemove,
  onSend,
}: {
  assignees: { name: string; phone: string }[]
  onAdd: (name: string, phone: string) => void
  onRemove: (name: string) => void
  onSend: (assignees: { name: string; phone: string }[]) => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')

  const handleAdd = () => {
    const name = nameInput.trim()
    if (!name) return
    onAdd(name, phoneInput.trim())
    setNameInput('')
    setPhoneInput('')
    setIsAdding(false)
  }

  const assigneesWithPhone = assignees.filter(a => a.phone)

  return (
    <div className="pt-3 border-t border-border/50">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium shrink-0">Assigned to:</span>

        {assignees.length === 0 && !isAdding && (
          <span className="text-xs text-muted-foreground italic">No one yet</span>
        )}

        {assignees.map(a => (
          <span
            key={a.name}
            className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full"
          >
            <User className="h-3 w-3" />
            {a.name}
            {a.phone && <span className="opacity-60">{a.phone}</span>}
            <button
              onClick={() => onRemove(a.name)}
              aria-label={`Remove ${a.name}`}
              className="hover:text-foreground ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-full px-2 py-1 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Assign
          </button>
        )}

        {assigneesWithPhone.length > 0 && (
          <button
            onClick={() => onSend(assigneesWithPhone)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Send className="h-3 w-3" />
            Notify
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mt-2 flex gap-2 flex-wrap">
          <Input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Name"
            className="flex-1 min-w-28 h-8 text-xs"
          />
          <Input
            value={phoneInput}
            onChange={e => setPhoneInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Phone (optional)"
            className="w-36 h-8 text-xs"
          />
          <Button variant="default" size="sm" onClick={handleAdd} className="h-8 text-xs">Add</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setIsAdding(false); setNameInput(''); setPhoneInput('') }}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Funeral Checklist ──────────────────────────────────────────────────────
function FuneralChecklist({
  deceasedName,
  onSendSms,
}: {
  deceasedName: string
  onSendSms: (messages: { to: string; name: string; taskDetails: string; deceasedName: string; taskCount: number }[]) => Promise<void>
}) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [assignees, setAssignees] = useState<{ name: string; phone: string }[]>([])

  const toggleItem = (index: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const completedCount = checkedItems.size
  const totalCount = FUNERAL_CHECKLIST_ITEMS.length

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="font-serif text-xl text-foreground">Funeral Checklist</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{completedCount} of {totalCount} tasks complete</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe] font-medium">Memorial</Badge>
            <span className="text-sm text-muted-foreground whitespace-nowrap">When ready</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-3">
          {FUNERAL_CHECKLIST_ITEMS.map((item, index) => (
            <label key={index} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox checked={checkedItems.has(index)} onCheckedChange={() => toggleItem(index)} />
              <span className={`text-sm transition-all ${checkedItems.has(index) ? 'text-muted-foreground line-through' : 'text-foreground group-hover:text-primary'}`}>
                {item}
              </span>
            </label>
          ))}
        </div>
        <AssignSection
          assignees={assignees}
          onAdd={(name, phone) => setAssignees(prev => [...prev.filter(a => a.name !== name), { name, phone }])}
          onRemove={(name) => setAssignees(prev => prev.filter(a => a.name !== name))}
          onSend={(withPhone) => onSendSms(withPhone.map(a => ({
            to: a.phone,
            name: a.name,
            taskDetails: '• Funeral Checklist',
            deceasedName,
            taskCount: 1,
          })))}
        />
      </CardContent>
    </Card>
  )
}

// ── Memorial Card ──────────────────────────────────────────────────────────
function MemorialCard({
  item,
  deceasedName,
  onSendSms,
}: {
  item: MemorialItem
  deceasedName: string
  onSendSms: (messages: { to: string; name: string; taskDetails: string; deceasedName: string; taskCount: number }[]) => Promise<void>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [copyText, setCopyText] = useState('Copy')
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(item.content)
  const [assignees, setAssignees] = useState<{ name: string; phone: string }[]>([])

  const label = MEMORIAL_LABELS[item.type] || item.title

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
          <CardTitle className="font-serif text-xl text-foreground">{item.title}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe] font-medium">Memorial</Badge>
            <span className="text-sm text-muted-foreground whitespace-nowrap">When ready</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {isOpen ? 'Hide' : 'View'}
              {isOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {isEditing ? (
              <div>
                <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="min-h-80 font-mono text-sm" />
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="default">Save Edit</Button>
                  <Button onClick={() => { setEditedContent(item.content); setIsEditing(false) }} variant="outline">Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white border border-border rounded-lg p-4 sm:p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">{editedContent}</pre>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={handleCopy}>{copyText}</Button>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        <AssignSection
          assignees={assignees}
          onAdd={(name, phone) => setAssignees(prev => [...prev.filter(a => a.name !== name), { name, phone }])}
          onRemove={(name) => setAssignees(prev => prev.filter(a => a.name !== name))}
          onSend={(withPhone) => onSendSms(withPhone.map(a => ({
            to: a.phone,
            name: a.name,
            taskDetails: `• ${label}`,
            deceasedName,
            taskCount: 1,
          })))}
        />
      </CardContent>
    </Card>
  )
}

// ── Urgency Badge ──────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }: { urgency: Institution['urgency'] }) {
  const variants = {
    urgent: 'bg-primary text-primary-foreground',
    soon: 'bg-amber-600 text-white',
    later: 'bg-muted text-muted-foreground',
  }
  const labels = { urgent: 'Urgent', soon: 'Soon', later: 'When Ready' }
  return <Badge className={`${variants[urgency]} font-medium`}>{labels[urgency]}</Badge>
}

// ── Institution Card ───────────────────────────────────────────────────────
function InstitutionCard({ 
  institution, index, sent, onVerify, onMarkSent, deceasedName, onSendSms,
}: { 
  institution: Institution & { verified?: boolean }
  index: number
  sent: boolean
  onVerify: (institutionName: string, index: number) => Promise<{ refinedLetter: string; sources: string[] }>
  onMarkSent: (index: number) => void
  deceasedName: string
  onSendSms: (messages: { to: string; name: string; taskDetails: string; deceasedName: string; taskCount: number }[]) => Promise<void>
}) {
  const [isLetterOpen, setIsLetterOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [sources, setSources] = useState<string[]>([])
  const [copyText, setCopyText] = useState('Copy Letter')
  const [isEditing, setIsEditing] = useState(false)
  const [editedLetter, setEditedLetter] = useState(institution.letter)
  const [assignees, setAssignees] = useState<{ name: string; phone: string }[]>([])

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
              <CardTitle className="font-serif text-xl text-foreground">{institution.name}</CardTitle>
              {institution.verified && <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Verified with current law" />}
              {sent && <Badge className="bg-green-100 text-green-800 border border-green-200 font-medium">Sent</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{institution.category}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!sent && <UrgencyBadge urgency={institution.urgency} />}
            <span className="text-sm text-muted-foreground whitespace-nowrap">{institution.deadlineDays} days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-foreground">{institution.reasonForDeadline}</p>

        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Documents Needed:</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            {institution.evidenceNeeded.map((doc, i) => <li key={i}>{doc}</li>)}
          </ul>
        </div>

        <Collapsible open={isLetterOpen} onOpenChange={setIsLetterOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {isLetterOpen ? 'Hide Letter' : 'View Letter'}
              {isLetterOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {isEditing ? (
              <div>
                <Textarea value={editedLetter} onChange={(e) => setEditedLetter(e.target.value)} className="min-h-80 font-mono text-sm" />
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="default">Save Edit</Button>
                  <Button onClick={() => { setEditedLetter(institution.letter); setIsEditing(false) }} variant="outline">Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white border border-border rounded-lg p-4 sm:p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">{editedLetter}</pre>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2 flex-wrap">
                  <Button onClick={handleVerify} disabled={isVerifying || institution.verified} variant={institution.verified ? 'outline' : 'default'} className="flex-1 sm:flex-none">
                    {isVerifying ? (<><Spinner className="mr-2" />Verifying...</>) : institution.verified ? (<><CheckCircle2 className="h-4 w-4 mr-2" />Verified</>) : 'Verify with Current Law'}
                  </Button>
                  <Button variant="outline" onClick={handleCopyLetter} className="flex-1 sm:flex-none">{copyText}</Button>
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none">Edit Letter</Button>
                  {!sent && (
                    <Button variant="outline" onClick={() => onMarkSent(index)} className="flex-1 sm:flex-none border-green-300 text-green-800 hover:bg-green-50">
                      Mark as sent
                    </Button>
                  )}
                </div>
                {verifyError && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />{verifyError}
                  </div>
                )}
                {sources.length > 0 && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Sources Used:</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {sources.map((source, i) => <li key={i} className="truncate">{source}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        <AssignSection
          assignees={assignees}
          onAdd={(name, phone) => setAssignees(prev => [...prev.filter(a => a.name !== name), { name, phone }])}
          onRemove={(name) => setAssignees(prev => prev.filter(a => a.name !== name))}
          onSend={(withPhone) => onSendSms(withPhone.map(a => ({
            to: a.phone,
            name: a.name,
            taskDetails: `• ${institution.name} (${institution.deadlineDays} days)`,
            deceasedName,
            taskCount: 1,
          })))}
        />
      </CardContent>
    </Card>
  )
}

// ── Root export ────────────────────────────────────────────────────────────
export function InstitutionCards({ institutions, memorialItems, onVerify, onStartOver, deceasedName }: InstitutionCardsProps) {
  const [sentIndices, setSentIndices] = useState<Set<number>>(new Set())

  const handleMarkSent = (index: number) => setSentIndices(prev => new Set(prev).add(index))

  const handleSendSms = async (messages: { to: string; name: string; taskDetails: string; deceasedName: string; taskCount: number }[]) => {
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to send')
      toast.success(`Notification sent to ${messages.map(m => m.name).join(', ')}!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification')
    }
  }

  const unsent = institutions.map((inst, i) => ({ inst, i })).filter(({ i }) => !sentIndices.has(i))
  const sentList = institutions.map((inst, i) => ({ inst, i })).filter(({ i }) => sentIndices.has(i))
  const ordered = [...unsent, ...sentList]
  const sentCount = sentIndices.size
  const remaining = institutions.length - sentCount
  const total = institutions.length
  const progressPct = total > 0 ? (sentCount / total) * 100 : 0

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="font-serif text-2xl sm:text-3xl text-foreground">Your Action Items</h2>
        <Button variant="outline" onClick={onStartOver}>Start Over</Button>
      </div>

      {/* Progress bar */}
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
            style={{ width: `${progressPct}%`, backgroundColor: 'var(--color-primary)' }}
            role="progressbar"
            aria-valuenow={sentCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${sentCount} of ${total} notifications sent`}
          />
        </div>
      </div>

      {/* Institution cards */}
      <div className="flex flex-col gap-4">
        {ordered.map(({ inst, i }) => (
          <InstitutionCard
            key={`${inst.name}-${i}`}
            institution={inst}
            index={i}
            sent={sentIndices.has(i)}
            onVerify={onVerify}
            onMarkSent={handleMarkSent}
            deceasedName={deceasedName}
            onSendSms={handleSendSms}
          />
        ))}
      </div>

      {/* Memorial section */}
      {memorialItems.length > 0 && (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-1">Memorial Materials</h2>
            <p className="text-muted-foreground text-sm">Drafts to help you honor your loved one — complete when you are ready.</p>
          </div>
          <div className="flex flex-col gap-4">
            <FuneralChecklist
              deceasedName={deceasedName}
              onSendSms={handleSendSms}
            />
            {memorialItems.map((item) => (
              <MemorialCard
                key={item.type}
                item={item}
                deceasedName={deceasedName}
                onSendSms={handleSendSms}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
