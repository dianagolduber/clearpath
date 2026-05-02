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
import type { Institution } from '@/lib/types'

interface InstitutionCardsProps {
  institutions: Institution[]
  onVerify: (institutionName: string, index: number) => Promise<{ refinedLetter: string; sources: string[] }>
  onStartOver: () => void
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
  onVerify 
}: { 
  institution: Institution & { verified?: boolean }
  index: number
  onVerify: (institutionName: string, index: number) => Promise<{ refinedLetter: string; sources: string[] }>
}) {
  const [isLetterOpen, setIsLetterOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [sources, setSources] = useState<string[]>([])

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

  return (
    <Card className="bg-card border-border">
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
            </div>
            <p className="text-sm text-muted-foreground">{institution.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <UrgencyBadge urgency={institution.urgency} />
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
            <div className="bg-white border border-border rounded-lg p-4 sm:p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                {institution.letter}
              </pre>
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
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
                onClick={() => navigator.clipboard.writeText(institution.letter)}
                className="flex-1 sm:flex-none"
              >
                Copy Letter
              </Button>
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

export function InstitutionCards({ institutions, onVerify, onStartOver }: InstitutionCardsProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-1">
            Your Action Items
          </h2>
          <p className="text-muted-foreground">
            {institutions.length} institutions to contact, sorted by deadline
          </p>
        </div>
        <Button variant="outline" onClick={onStartOver}>
          Start Over
        </Button>
      </div>
      
      <div className="flex flex-col gap-4">
        {institutions.map((institution, index) => (
          <InstitutionCard
            key={`${institution.name}-${index}`}
            institution={institution}
            index={index}
            onVerify={onVerify}
          />
        ))}
      </div>
    </div>
  )
}
