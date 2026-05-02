'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Copy, Check } from 'lucide-react'

function decodeLetterData(id: string): {
  institutionName: string
  deadlineDays: number
  letter: string
  deceasedName: string
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

export default function LetterPage() {
  const params = useParams()
  const id = params.id as string
  
  const [data, setData] = useState<{
    institutionName: string
    deadlineDays: number
    letter: string
    deceasedName: string
  } | null>(null)
  
  const [letterText, setLetterText] = useState('')
  const [copyText, setCopyText] = useState('Copy Letter')
  const [markedSent, setMarkedSent] = useState(false)

  useEffect(() => {
    if (id) {
      const decoded = decodeLetterData(id)
      if (decoded) {
        setData(decoded)
        setLetterText(decoded.letter)
      }
    }
  }, [id])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letterText)
    setCopyText('Copied!')
    setTimeout(() => setCopyText('Copy Letter'), 2000)
  }

  const handleMarkSent = () => {
    setMarkedSent(true)
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Invalid or expired letter link.</p>
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
            <h1 className="font-serif text-xl text-foreground">Aftermath</h1>
            <span className="text-sm text-muted-foreground">
              Handling affairs for {data.deceasedName}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="font-serif text-2xl text-foreground">
                  {data.institutionName}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Letter for {data.deceasedName}&apos;s estate
                </p>
              </div>
              <div className="flex items-center gap-2">
                <UrgencyBadge days={data.deadlineDays} />
                {markedSent && (
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Sent
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Editable letter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Your Letter
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Edit this letter as needed, then copy and send via mail or email.
              </p>
              <textarea
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                className="w-full min-h-[400px] p-4 border border-border rounded-lg bg-white font-mono text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCopy}
                className="flex-1"
                variant={copyText === 'Copied!' ? 'outline' : 'default'}
              >
                {copyText === 'Copied!' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copyText}
              </Button>
              
              {!markedSent && (
                <Button
                  onClick={handleMarkSent}
                  variant="outline"
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Sent
                </Button>
              )}
            </div>

            {/* Instructions */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium text-foreground mb-2">Next Steps</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Review and edit the letter above</li>
                <li>Copy the letter and paste into your mail or email</li>
                <li>Include a certified copy of the death certificate</li>
                <li>Mark as sent when complete</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Sent by <span className="font-medium">Aftermath</span> — handling what comes after
          </p>
        </footer>
      </main>
    </div>
  )
}
