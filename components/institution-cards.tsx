'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, User, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { Institution, MemorialItem } from '@/lib/types'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

// ── Assignee pill shown on a card ──────────────────────────────────────────
function AssigneePill({
  name,
  onRemove,
}: {
  name: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
      <User className="h-3 w-3" />
      {name}
      <button onClick={onRemove} aria-label={`Remove ${name}`} className="hover:text-foreground ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

// ── Assign section inside a card ───────────────────────────────────────────
function AssignSection({
  cardKey,
  familyMembers,
  assignedNames,
  onAssign,
  onUnassign,
}: {
  cardKey: string
  familyMembers: string[]
  assignedNames: string[]
  onAssign: (name: string) => void
  onUnassign: (name: string) => void
}) {
  const unassigned = familyMembers.filter(m => !assignedNames.includes(m))

  return (
    <div className="pt-3 border-t border-border/50">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Assigned to:</span>
        {assignedNames.length === 0 && (
          <span className="text-xs text-muted-foreground italic">No one yet</span>
        )}
        {assignedNames.map(name => (
          <AssigneePill key={name} name={name} onRemove={() => onUnassign(name)} />
        ))}
        {unassigned.length > 0 && (
          <Select value="none" onValueChange={(val) => { if (val !== 'none') onAssign(val) }}>
            <SelectTrigger className="h-7 text-xs w-auto min-w-28 border-dashed">
              <SelectValue placeholder="+ Assign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">+ Assign someone</SelectItem>
              {unassigned.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

// ── Funeral Checklist ──────────────────────────────────────────────────────
function FuneralChecklist({ familyMembers, assignments, onAssign, onUnassign }: {
  familyMembers: string[]
  assignments: Record<string, string[]>
  onAssign: (cardKey: string, name: string) => void
  onUnassign: (cardKey: string, name: string) => void
}) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())

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
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount} of {totalCount} tasks complete
            </p>
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
        {familyMembers.length > 0 && (
          <AssignSection
            cardKey="checklist"
            familyMembers={familyMembers}
            assignedNames={assignments['checklist'] ?? []}
            onAssign={(name) => onAssign('checklist', name)}
            onUnassign={(name) => onUnassign('checklist', name)}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ── Memorial Card ──────────────────────────────────────────────────────────
function MemorialCard({ item, familyMembers, assignments, onAssign, onUnassign }: {
  item: MemorialItem
  familyMembers: string[]
  assignments: Record<string, string[]>
  onAssign: (cardKey: string, name: string) => void
  onUnassign: (cardKey: string, name: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [copyText, setCopyText] = useState('Copy')
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(item.content)

  const cardKey = `memorial-${item.type}`

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

        {familyMembers.length > 0 && (
          <AssignSection
            cardKey={cardKey}
            familyMembers={familyMembers}
            assignedNames={assignments[cardKey] ?? []}
            onAssign={(name) => onAssign(cardKey, name)}
            onUnassign={(name) => onUnassign(cardKey, name)}
          />
        )}
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
  institution, index, sent, onVerify, onMarkSent,
  familyMembers, assignments, onAssign, onUnassign,
}: { 
  institution: Institution & { verified?: boolean }
  index: number
  sent: boolean
  onVerify: (institutionName: string, index: number) => Promise<{ refinedLetter: string; sources: string[] }>
  onMarkSent: (index: number) => void
  familyMembers: string[]
  assignments: Record<string, string[]>
  onAssign: (cardKey: string, name: string) => void
  onUnassign: (cardKey: string, name: string) => void
}) {
  const [isLetterOpen, setIsLetterOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [sources, setSources] = useState<string[]>([])
  const [copyText, setCopyText] = useState('Copy Letter')
  const [isEditing, setIsEditing] = useState(false)
  const [editedLetter, setEditedLetter] = useState(institution.letter)

  const cardKey = `institution-${index}`

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
              {sent && <Badge className="bg-green-100 text-green-800 border border-green-200 font-medium">Sent ✓</Badge>}
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

        {familyMembers.length > 0 && (
          <AssignSection
            cardKey={cardKey}
            familyMembers={familyMembers}
            assignedNames={assignments[cardKey] ?? []}
            onAssign={(name) => onAssign(cardKey, name)}
            onUnassign={(name) => onUnassign(cardKey, name)}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ── Root export ────────────────────────────────────────────────────────────
export function InstitutionCards({ institutions, memorialItems, onVerify, onStartOver, deceasedName }: InstitutionCardsProps) {
  const [sentIndices, setSentIndices] = useState<Set<number>>(new Set())
  const [familyInput, setFamilyInput] = useState('')
  const [familyMembers, setFamilyMembers] = useState<string[]>([])
  // cardKey -> list of assigned member names
  const [assignments, setAssignments] = useState<Record<string, string[]>>({})

  const handleMarkSent = (index: number) => setSentIndices(prev => new Set(prev).add(index))

  const handleAddMember = () => {
    const name = familyInput.trim()
    if (!name || familyMembers.includes(name)) return
    setFamilyMembers(prev => [...prev, name])
    setFamilyInput('')
  }

  const handleRemoveMember = (name: string) => {
    setFamilyMembers(prev => prev.filter(m => m !== name))
    // also remove from all assignments
    setAssignments(prev => {
      const next: Record<string, string[]> = {}
      for (const [key, names] of Object.entries(prev)) {
        next[key] = names.filter(n => n !== name)
      }
      return next
    })
  }

  const handleAssign = (cardKey: string, name: string) => {
    setAssignments(prev => ({
      ...prev,
      [cardKey]: [...(prev[cardKey] ?? []), name],
    }))
  }

  const handleUnassign = (cardKey: string, name: string) => {
    setAssignments(prev => ({
      ...prev,
      [cardKey]: (prev[cardKey] ?? []).filter(n => n !== name),
    }))
  }

  const unsent = institutions.map((inst, i) => ({ inst, i })).filter(({ i }) => !sentIndices.has(i))
  const sent = institutions.map((inst, i) => ({ inst, i })).filter(({ i }) => sentIndices.has(i))
  const ordered = [...unsent, ...sent]
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

      {/* Family member management */}
      <div className="mb-8 p-4 bg-muted/30 border border-border rounded-lg">
        <h3 className="text-sm font-medium text-foreground mb-3">Family Members</h3>
        <p className="text-xs text-muted-foreground mb-3">Add names here, then assign them directly on each card below.</p>
        <div className="flex gap-2 mb-3">
          <Input
            value={familyInput}
            onChange={e => setFamilyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddMember()}
            placeholder="Enter a name and press Enter"
            className="flex-1 h-9 text-sm"
          />
          <Button variant="outline" onClick={handleAddMember} className="h-9 text-sm shrink-0">Add</Button>
        </div>
        {familyMembers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {familyMembers.map(name => (
              <span key={name} className="inline-flex items-center gap-1 bg-background border border-border text-foreground text-xs px-2.5 py-1 rounded-full">
                <User className="h-3 w-3 text-muted-foreground" />
                {name}
                <button onClick={() => handleRemoveMember(name)} aria-label={`Remove ${name}`} className="ml-0.5 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
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
            familyMembers={familyMembers}
            assignments={assignments}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
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
              familyMembers={familyMembers}
              assignments={assignments}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
            />
            {memorialItems.map((item) => (
              <MemorialCard
                key={item.type}
                item={item}
                familyMembers={familyMembers}
                assignments={assignments}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
