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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, User, X, Send, Plus, Mail } from 'lucide-react'
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

interface FamilyMember {
  id: string
  name: string
  email: string
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

// ── Family Member Selector (per card) ──────────────────────────────────────
function FamilySelector({
  familyMembers,
  selectedId,
  onSelect,
}: {
  familyMembers: FamilyMember[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  if (familyMembers.length === 0) return null

  return (
    <div className="pt-3 border-t border-border/50">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium shrink-0">Assign to:</span>
        <Select value={selectedId || 'none'} onValueChange={(v) => onSelect(v === 'none' ? null : v)}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder="Select person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No one</SelectItem>
            {familyMembers.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedId && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Assigned
          </span>
        )}
      </div>
    </div>
  )
}

// ── Funeral Checklist ──────────────────────────────────────────────────────
function FuneralChecklist({
  familyMembers,
  selectedAssignee,
  onAssign,
}: {
  familyMembers: FamilyMember[]
  selectedAssignee: string | null
  onAssign: (id: string | null) => void
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
        <FamilySelector familyMembers={familyMembers} selectedId={selectedAssignee} onSelect={onAssign} />
      </CardContent>
    </Card>
  )
}

// ── Memorial Card ──────────────────────────────────────────────────────────
function MemorialCard({
  item,
  familyMembers,
  selectedAssignee,
  onAssign,
  getEditedContent,
  setEditedContent,
}: {
  item: MemorialItem
  familyMembers: FamilyMember[]
  selectedAssignee: string | null
  onAssign: (id: string | null) => void
  getEditedContent: () => string
  setEditedContent: (content: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [copyText, setCopyText] = useState('Copy')
  const [isEditing, setIsEditing] = useState(false)
  const editedContent = getEditedContent()

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
        <FamilySelector familyMembers={familyMembers} selectedId={selectedAssignee} onSelect={onAssign} />
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
  institution, index, sent, onVerify, onMarkSent, familyMembers, selectedAssignee, onAssign, getEditedLetter, setEditedLetter,
}: { 
  institution: Institution & { verified?: boolean }
  index: number
  sent: boolean
  onVerify: (institutionName: string, index: number) => Promise<{ refinedLetter: string; sources: string[] }>
  onMarkSent: (index: number) => void
  familyMembers: FamilyMember[]
  selectedAssignee: string | null
  onAssign: (id: string | null) => void
  getEditedLetter: () => string
  setEditedLetter: (letter: string) => void
}) {
  const [isLetterOpen, setIsLetterOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [sources, setSources] = useState<string[]>([])
  const [copyText, setCopyText] = useState('Copy Letter')
  const [isEditing, setIsEditing] = useState(false)
  const editedLetter = getEditedLetter()

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
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Sources used to verify this letter:</h5>
                    <ul className="space-y-1">
                      {sources.map((source, i) => {
                        let domain = source
                        try { domain = new URL(source).hostname.replace('www.', '') } catch {}
                        return (
                          <li key={i}>
                            <a
                              href={source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline underline-offset-2 hover:opacity-80 truncate block"
                            >
                              {domain}
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        <FamilySelector familyMembers={familyMembers} selectedId={selectedAssignee} onSelect={onAssign} />
      </CardContent>
    </Card>
  )
}

// ── Root export ────────────────────────────────────────────────────────────
export function InstitutionCards({ institutions, memorialItems, onVerify, onStartOver, deceasedName }: InstitutionCardsProps) {
  const [sentIndices, setSentIndices] = useState<Set<number>>(new Set())
  
  // Family members (up to 5)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  
  // Assignments: taskKey -> memberId
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  
  // Edited letters/content
  const [editedLetters, setEditedLetters] = useState<Record<string, string>>({})
  const [editedMemorials, setEditedMemorials] = useState<Record<string, string>>({})
  
  const [isSending, setIsSending] = useState(false)

  const handleMarkSent = (index: number) => setSentIndices(prev => new Set(prev).add(index))

  const handleAddMember = () => {
    const name = nameInput.trim()
    const email = emailInput.trim()
    if (!name || !email || !email.includes('@')) {
      toast.error('Please enter a name and valid email')
      return
    }
    if (familyMembers.length >= 5) {
      toast.error('Maximum 5 family members')
      return
    }
    if (familyMembers.some(m => m.email === email)) {
      toast.error('This email is already added')
      return
    }
    setFamilyMembers(prev => [...prev, { id: crypto.randomUUID(), name, email }])
    setNameInput('')
    setEmailInput('')
  }

  const handleRemoveMember = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id))
    // Remove their assignments
    setAssignments(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (next[key] === id) delete next[key]
      }
      return next
    })
  }

  const handleAssign = (taskKey: string, memberId: string | null) => {
    setAssignments(prev => {
      const next = { ...prev }
      if (memberId) next[taskKey] = memberId
      else delete next[taskKey]
      return next
    })
  }

  // Count tasks per member
  const getTaskCount = (memberId: string) => {
    return Object.values(assignments).filter(id => id === memberId).length
  }

  // Get edited letter for institution
  const getEditedLetter = (index: number) => {
    return editedLetters[`inst-${index}`] ?? institutions[index]?.letter ?? ''
  }
  const setEditedLetter = (index: number, letter: string) => {
    setEditedLetters(prev => ({ ...prev, [`inst-${index}`]: letter }))
  }

  // Get edited content for memorial
  const getEditedMemorial = (type: string, original: string) => {
    return editedMemorials[type] ?? original
  }
  const setEditedMemorial = (type: string, content: string) => {
    setEditedMemorials(prev => ({ ...prev, [type]: content }))
  }

  // Send all assignments
  const handleSendAssignments = async () => {
    // Group assignments by member
    const memberAssignments: Record<string, { institutionName: string; deadlineDays: number; letter: string }[]> = {}
    
    for (const [taskKey, memberId] of Object.entries(assignments)) {
      if (!memberAssignments[memberId]) memberAssignments[memberId] = []
      
      if (taskKey.startsWith('inst-')) {
        const idx = parseInt(taskKey.replace('inst-', ''))
        const inst = institutions[idx]
        if (inst) {
          memberAssignments[memberId].push({
            institutionName: inst.name,
            deadlineDays: inst.deadlineDays,
            letter: getEditedLetter(idx),
          })
        }
      } else if (taskKey === 'checklist') {
        memberAssignments[memberId].push({
          institutionName: 'Funeral Checklist',
          deadlineDays: 0,
          letter: FUNERAL_CHECKLIST_ITEMS.map(item => `○ ${item}`).join('\n'),
        })
      } else if (taskKey.startsWith('memorial-')) {
        const type = taskKey.replace('memorial-', '')
        const item = memorialItems.find(m => m.type === type)
        if (item) {
          memberAssignments[memberId].push({
            institutionName: MEMORIAL_LABELS[item.type] || item.title,
            deadlineDays: 0,
            letter: getEditedMemorial(type, item.content),
          })
        }
      }
    }

    // Build emails - one per member with all their tasks
    const emails = Object.entries(memberAssignments)
      .map(([memberId, tasks]) => {
        const member = familyMembers.find(m => m.id === memberId)
        if (!member || tasks.length === 0) return null
        return {
          to: member.email,
          name: member.name,
          deceasedName,
          tasks,
        }
      })
      .filter(Boolean)

    if (emails.length === 0) {
      toast.error('No assignments to send')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to send')
      toast.success(`Emails sent to ${emails.length} family member${emails.length > 1 ? 's' : ''}!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send emails')
    } finally {
      setIsSending(false)
    }
  }

  const unsent = institutions.map((inst, i) => ({ inst, i })).filter(({ i }) => !sentIndices.has(i))
  const sentList = institutions.map((inst, i) => ({ inst, i })).filter(({ i }) => sentIndices.has(i))
  const ordered = [...unsent, ...sentList]
  const sentCount = sentIndices.size
  const remaining = institutions.length - sentCount
  const total = institutions.length
  const progressPct = total > 0 ? (sentCount / total) * 100 : 0
  const totalAssignments = Object.keys(assignments).length
  const membersWithTasks = familyMembers.filter(m => getTaskCount(m.id) > 0)

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-1">Your Action Items</h2>
        </div>
        <Button variant="outline" onClick={onStartOver}>Start Over</Button>
      </div>

      {/* Family Members Panel */}
      <div className="mb-6 p-4 bg-muted/30 border border-border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            Assign to Family
          </h3>
          <span className="text-xs text-muted-foreground">{familyMembers.length}/5 members</span>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3">
          Add family members, then assign tasks to them using the dropdown on each card. Send one email per person with all their assignments.
        </p>

        {/* Add member form */}
        {familyMembers.length < 5 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <Input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMember()}
              placeholder="Name"
              className="flex-1 min-w-28 h-9 text-sm"
            />
            <Input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMember()}
              placeholder="Email"
              className="flex-1 min-w-40 h-9 text-sm"
            />
            <Button variant="outline" onClick={handleAddMember} className="h-9 text-sm shrink-0">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        )}

        {/* Family member list with task counts */}
        {familyMembers.length > 0 && (
          <div className="space-y-2">
            {familyMembers.map(member => {
              const taskCount = getTaskCount(member.id)
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 bg-background border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${taskCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">{member.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 truncate block sm:inline">{member.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {taskCount} task{taskCount !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${member.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Send button */}
        {membersWithTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              onClick={handleSendAssignments}
              disabled={isSending}
              className="w-full"
            >
              {isSending ? (
                <><Spinner className="mr-2 h-4 w-4" /> Sending...</>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    Send Assignments ({totalAssignments} task{totalAssignments !== 1 ? 's' : ''} to {membersWithTasks.length} person{membersWithTasks.length !== 1 ? 's' : ''})
                  </span>
                </>
              )}
            </Button>
          </div>
        )}
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
            familyMembers={familyMembers}
            selectedAssignee={assignments[`inst-${i}`] || null}
            onAssign={(memberId) => handleAssign(`inst-${i}`, memberId)}
            getEditedLetter={() => getEditedLetter(i)}
            setEditedLetter={(letter) => setEditedLetter(i, letter)}
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
              selectedAssignee={assignments['checklist'] || null}
              onAssign={(memberId) => handleAssign('checklist', memberId)}
            />
            {memorialItems.map((item) => (
              <MemorialCard
                key={item.type}
                item={item}
                familyMembers={familyMembers}
                selectedAssignee={assignments[`memorial-${item.type}`] || null}
                onAssign={(memberId) => handleAssign(`memorial-${item.type}`, memberId)}
                getEditedContent={() => getEditedMemorial(item.type, item.content)}
                setEditedContent={(content) => setEditedMemorial(item.type, content)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
