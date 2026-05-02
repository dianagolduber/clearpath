'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { AlertCircle, Trash2 } from 'lucide-react'
import type { Institution } from '@/lib/types'

interface FamilyMember {
  id: string
  name: string
  phone: string
}

interface Assignment {
  familyMemberId: string
  institutionIndex: number
}

interface FamilyAssignmentProps {
  institutions: Institution[]
  deceasedName: string
}

export function FamilyAssignment({ institutions, deceasedName }: FamilyAssignmentProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)

  const handleAddFamilyMember = () => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: '',
      phone: '',
    }
    setFamilyMembers([...familyMembers, newMember])
  }

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(m => m.id !== id))
    setAssignments(assignments.filter(a => a.familyMemberId !== id))
  }

  const handleUpdateFamilyMember = (id: string, field: 'name' | 'phone', value: string) => {
    setFamilyMembers(familyMembers.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  const handleAssignInstitution = (familyMemberId: string, institutionIndex: number) => {
    // Remove any existing assignment for this member
    const filtered = assignments.filter(a => a.familyMemberId !== familyMemberId)
    if (institutionIndex >= 0) {
      setAssignments([...filtered, { familyMemberId, institutionIndex }])
    } else {
      setAssignments(filtered)
    }
  }

  const handleSendAssignments = async () => {
    if (familyMembers.length === 0 || assignments.length === 0) {
      setSendError('Please add family members and assign institutions')
      return
    }

    setIsSending(true)
    setSendError(null)
    setSendSuccess(false)

    try {
      const messages = assignments.map(assignment => {
        const member = familyMembers.find(m => m.id === assignment.familyMemberId)
        const institution = institutions[assignment.institutionIndex]
        if (!member || !institution) return null

        return {
          to: member.phone,
          name: member.name,
          institutionName: institution.name,
          deadlineDays: institution.deadlineDays,
          deceasedName,
        }
      }).filter(Boolean)

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send messages')
      }

      setSendSuccess(true)
      setTimeout(() => setSendSuccess(false), 5000)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send assignments')
    } finally {
      setIsSending(false)
    }
  }

  const unassignedMembers = familyMembers.filter(
    m => !assignments.find(a => a.familyMemberId === m.id)
  )

  return (
    <Card className="bg-card border-border mb-8">
      <CardHeader>
        <CardTitle className="font-serif text-2xl text-foreground">
          Assign & Notify Family
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Delegate institutions to family members and send them SMS reminders with deadlines.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Family Members Section */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Family Members</h3>
          <div className="space-y-3 mb-4">
            {familyMembers.map(member => (
              <div key={member.id} className="flex gap-2 items-end">
                <FieldGroup className="flex-1">
                  <Field>
                    <FieldLabel htmlFor={`name-${member.id}`} className="text-xs">Name</FieldLabel>
                    <Input
                      id={`name-${member.id}`}
                      value={member.name}
                      onChange={(e) => handleUpdateFamilyMember(member.id, 'name', e.target.value)}
                      placeholder="e.g., Sarah"
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup className="flex-1">
                  <Field>
                    <FieldLabel htmlFor={`phone-${member.id}`} className="text-xs">Phone (US)</FieldLabel>
                    <Input
                      id={`phone-${member.id}`}
                      value={member.phone}
                      onChange={(e) => handleUpdateFamilyMember(member.id, 'phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      type="tel"
                    />
                  </Field>
                </FieldGroup>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveFamilyMember(member.id)}
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

        {/* Assignments Section */}
        {familyMembers.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">Assign Institutions</h3>
            <div className="space-y-3">
              {familyMembers.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground min-w-24">{member.name || 'Unnamed'}</span>
                  <Select
                    value={
                      assignments.find(a => a.familyMemberId === member.id)?.institutionIndex.toString() ?? 'none'
                    }
                    onValueChange={(value) =>
                      handleAssignInstitution(member.id, value === 'none' ? -1 : parseInt(value))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select an institution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {institutions.map((inst, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {inst.name} ({inst.deadlineDays} days)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="pt-4 border-t border-border">
          <Button
            onClick={handleSendAssignments}
            disabled={isSending || familyMembers.length === 0 || assignments.length === 0}
            className="w-full"
          >
            {isSending ? (
              <>
                <Spinner className="mr-2" />
                Sending...
              </>
            ) : (
              'Send Assignments'
            )}
          </Button>
        </div>

        {/* Messages */}
        {sendError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {sendError}
          </div>
        )}
        {sendSuccess && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
            ✓ Assignments sent successfully!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
