'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { AlertCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { Institution, MemorialItem } from '@/lib/types'

interface FamilyMember {
  id: string
  name: string
  phone: string
}

// A flat list of tasks — either an institution or a memorial item
interface TaskItem {
  key: string
  label: string
  sublabel: string
  isMemorial: boolean
  deadlineDays?: number
}

interface FamilyAssignmentProps {
  institutions: Institution[]
  memorialItems: MemorialItem[]
  deceasedName: string
}

export function FamilyAssignment({ institutions, memorialItems, deceasedName }: FamilyAssignmentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  // memberId -> Set of task keys assigned to them
  const [assignments, setAssignments] = useState<Record<string, Set<string>>>({})
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)

  const tasks: TaskItem[] = [
    ...institutions.map((inst, i) => ({
      key: `institution-${i}`,
      label: inst.name,
      sublabel: `${inst.deadlineDays} days — ${inst.category}`,
      isMemorial: false,
      deadlineDays: inst.deadlineDays,
    })),
    ...memorialItems.map((item) => ({
      key: `memorial-${item.type}`,
      label: item.title,
      sublabel: 'When ready',
      isMemorial: true,
    })),
  ]

  const handleAddFamilyMember = () => {
    const newMember: FamilyMember = { id: Date.now().toString(), name: '', phone: '' }
    setFamilyMembers(prev => [...prev, newMember])
    setAssignments(prev => ({ ...prev, [newMember.id]: new Set() }))
  }

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id))
    setAssignments(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleUpdateFamilyMember = (id: string, field: 'name' | 'phone', value: string) => {
    setFamilyMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const handleToggleTask = (memberId: string, taskKey: string) => {
    setAssignments(prev => {
      const current = new Set(prev[memberId] ?? [])
      if (current.has(taskKey)) {
        current.delete(taskKey)
      } else {
        current.add(taskKey)
      }
      return { ...prev, [memberId]: current }
    })
  }

  const totalAssigned = Object.values(assignments).reduce((sum, set) => sum + set.size, 0)

  const handleSendAssignments = async () => {
    if (familyMembers.length === 0 || totalAssigned === 0) {
      setSendError('Please add family members and assign at least one task')
      return
    }

    setIsSending(true)
    setSendError(null)
    setSendSuccess(false)

    try {
      const messages: object[] = []

      for (const member of familyMembers) {
        const memberTasks = Array.from(assignments[member.id] ?? [])
        if (memberTasks.length === 0) continue

        const taskDetails = memberTasks.map(key => {
          const task = tasks.find(t => t.key === key)
          return task ? `• ${task.label} (${task.sublabel})` : null
        }).filter(Boolean).join('\n')

        messages.push({
          to: member.phone,
          name: member.name,
          taskDetails,
          deceasedName,
          taskCount: memberTasks.length,
        })
      }

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to send messages')

      setSendSuccess(true)
      setTimeout(() => setSendSuccess(false), 5000)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send assignments')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <button className="w-full text-left flex items-start justify-between gap-4 group">
              <div>
                <CardTitle className="font-serif text-2xl text-foreground">
                  Assign &amp; Notify Family
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Delegate tasks to family members and send them an SMS with their assignments and deadlines.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1 shrink-0">
                {totalAssigned > 0 && (
                  <Badge variant="outline" className="text-xs">{totalAssigned} assigned</Badge>
                )}
                {isOpen
                  ? <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  : <ChevronDown className="h-5 w-5 text-muted-foreground" />
                }
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-8 pt-0">

            {/* Family Members */}
            <div>
              <h3 className="text-base font-medium text-foreground mb-3">Family Members</h3>
              <div className="space-y-3 mb-4">
                {familyMembers.map(member => (
                  <div key={member.id} className="flex gap-2 items-end">
                    <FieldGroup className="flex-1">
                      <Field>
                        <FieldLabel htmlFor={`name-${member.id}`} className="text-xs">Name</FieldLabel>
                        <Input
                          id={`name-${member.id}`}
                          value={member.name}
                          onChange={e => handleUpdateFamilyMember(member.id, 'name', e.target.value)}
                          placeholder="e.g. Sarah"
                        />
                      </Field>
                    </FieldGroup>
                    <FieldGroup className="flex-1">
                      <Field>
                        <FieldLabel htmlFor={`phone-${member.id}`} className="text-xs">Phone (US)</FieldLabel>
                        <Input
                          id={`phone-${member.id}`}
                          value={member.phone}
                          onChange={e => handleUpdateFamilyMember(member.id, 'phone', e.target.value)}
                          placeholder="+15551234567"
                          type="tel"
                        />
                      </Field>
                    </FieldGroup>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFamilyMember(member.id)}
                      aria-label="Remove family member"
                      className="mb-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={handleAddFamilyMember}>
                + Add Family Member
              </Button>
            </div>

            {/* Task Assignment Grid */}
            {familyMembers.length > 0 && tasks.length > 0 && (
              <div>
                <h3 className="text-base font-medium text-foreground mb-3">Assign Tasks</h3>
                <p className="text-xs text-muted-foreground mb-4">Check each task you want to assign to each family member. One person can handle multiple tasks.</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-3 font-medium text-foreground min-w-48">Task</th>
                        {familyMembers.map(member => (
                          <th key={member.id} className="text-center px-3 py-3 font-medium text-foreground min-w-24">
                            {member.name || 'Unnamed'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Institution tasks */}
                      {tasks.filter(t => !t.isMemorial).length > 0 && (
                        <tr>
                          <td colSpan={familyMembers.length + 1} className="px-4 py-2 bg-muted/20">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notifications</span>
                          </td>
                        </tr>
                      )}
                      {tasks.filter(t => !t.isMemorial).map(task => (
                        <tr key={task.key} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground text-sm">{task.label}</div>
                            <div className="text-xs text-muted-foreground">{task.sublabel}</div>
                          </td>
                          {familyMembers.map(member => (
                            <td key={member.id} className="text-center px-3 py-3">
                              <Checkbox
                                checked={assignments[member.id]?.has(task.key) ?? false}
                                onCheckedChange={() => handleToggleTask(member.id, task.key)}
                                aria-label={`Assign ${task.label} to ${member.name || 'this member'}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}

                      {/* Memorial tasks */}
                      {tasks.filter(t => t.isMemorial).length > 0 && (
                        <tr>
                          <td colSpan={familyMembers.length + 1} className="px-4 py-2 bg-muted/20">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Memorial Materials</span>
                          </td>
                        </tr>
                      )}
                      {tasks.filter(t => t.isMemorial).map(task => (
                        <tr key={task.key} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm">{task.label}</span>
                              <Badge className="bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe] text-xs font-medium">Memorial</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{task.sublabel}</div>
                          </td>
                          {familyMembers.map(member => (
                            <td key={member.id} className="text-center px-3 py-3">
                              <Checkbox
                                checked={assignments[member.id]?.has(task.key) ?? false}
                                onCheckedChange={() => handleToggleTask(member.id, task.key)}
                                aria-label={`Assign ${task.label} to ${member.name || 'this member'}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Send */}
            <div className="pt-2 border-t border-border">
              <Button
                onClick={handleSendAssignments}
                disabled={isSending || familyMembers.length === 0 || totalAssigned === 0}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Spinner className="mr-2" />
                    Sending...
                  </>
                ) : (
                  `Send SMS Assignments${totalAssigned > 0 ? ` (${totalAssigned} task${totalAssigned !== 1 ? 's' : ''})` : ''}`
                )}
              </Button>
            </div>

            {sendError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {sendError}
              </div>
            )}
            {sendSuccess && (
              <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                Assignments sent successfully.
              </div>
            )}

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
