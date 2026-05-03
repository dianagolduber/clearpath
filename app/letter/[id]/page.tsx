'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface Assignment {
  institutionName: string
  deadlineDays: number
  letter: string
}

function decodePortalData(id: string): {
  familyMemberName: string
  deceasedName: string
  assignments: Assignment[]
} | null {
  try {
    const decoded = atob(decodeURIComponent(id))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function UrgencyBadge({ days }: { days: number }) {
  if (days <= 0) {
    return <Badge className="bg-muted text-muted-foreground border border-border">When ready</Badge>
  }
  if (days <= 14) {
    return <Badge className="bg-red-100 text-red-800 border border-red-200">{days} days</Badge>
  }
  if (days <= 60) {
    return <Badge className="bg-amber-100 text-amber-800 border border-amber-200">{days} days</Badge>
  }
  return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">{days} days</Badge>
}

function AssignmentCard({
  assignment,
  index,
}: {
  assignment: Assignment
  index: number
}) {
  const [isOpen, setIsOpen] = useState(index === 0)
  const [letterText, setLetterText] = useState(assignment.letter)
  const [copyText, setCopyText] = useState('Copy')
  const [markedSent, setMarkedSent] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letterText)
    setCopyText('Copied!')
    setTimeout(() => setCopyText('Copy'), 2000)
  }

  const handleMarkSent = () => {
    setMarkedSent(true)
  }

  return (
    <Card className="bg-white border-border shadow-sm">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="font-serif text-lg text-foreground truncate">
                {assignment.institutionName}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Deadline: <UrgencyBadge days={assignment.deadlineDays} />
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {markedSent && (
                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Sent
                </Badge>
              )}
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
      </div>

      {isOpen && (
        <CardContent className="space-y-4 border-t border-border pt-4">
          {/* Editable letter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Letter
            </label>
            <textarea
              value={letterText}
              onChange={(e) => setLetterText(e.target.value)}
              className="w-full min-h-[300px] p-4 border border-border rounded-lg bg-white font-mono text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant={copyText === 'Copied!' ? 'outline' : 'default'}
              size="sm"
            >
              {copyText === 'Copied!' ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {copyText}
            </Button>

            {!markedSent && (
              <Button
                onClick={handleMarkSent}
                variant="outline"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark as Sent
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function PortalPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<{
    familyMemberName: string
    deceasedName: string
    assignments: Assignment[]
  } | null>(null)

  useEffect(() => {
    if (id) {
      const decoded = decodePortalData(id)
      if (decoded) {
        setData(decoded)
      }
    }
  }, [id])

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Invalid or expired portal link.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/clear-path-logo.jpg" alt="Clear Path" className="h-6 w-6 object-contain" />
              <h1 className="font-serif text-xl text-foreground">Clear Path</h1>
            </div>
            <span className="text-sm text-muted-foreground">
              Handling affairs for {data.deceasedName}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* User greeting */}
        <div className="mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-1">
            Hi {data.familyMemberName}
          </h2>
          <p className="text-muted-foreground">
            You&apos;ve been assigned {data.assignments.length} task{data.assignments.length !== 1 ? 's' : ''} to handle. Click on each to view and edit the letter.
          </p>
        </div>

        {/* Assignments */}
        <div className="space-y-4 mb-8">
          {data.assignments.map((assignment, idx) => (
            <AssignmentCard
              key={idx}
              assignment={assignment}
              index={idx}
            />
          ))}
        </div>

        {/* Instructions */}
        <Card className="bg-muted/50 border-border">
          <CardContent className="p-4">
            <h3 className="font-medium text-foreground mb-3">Next Steps</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Review and edit each letter above</li>
              <li>Copy the letter and send via mail or email</li>
              <li>Include a certified copy of the death certificate if required</li>
              <li>Mark each task as sent when complete</li>
            </ol>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Sent by <span className="font-medium">Clear Path</span> — handling what comes after
          </p>
        </footer>
      </main>
    </div>
  )
}
