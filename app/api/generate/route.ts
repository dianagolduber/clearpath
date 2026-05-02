import { streamText, Output } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { generationResponseSchema } from '@/lib/types'

const openai = createOpenAI({
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,
})

export async function POST(req: Request) {
  try {
    const { description } = await req.json()

    if (!description || typeof description !== 'string') {
      return Response.json({ error: 'Description is required' }, { status: 400 })
    }

    const result = streamText({
      model: openai('anthropic/claude-sonnet-4-5'),
      system: `You are a compassionate estate administration assistant for Arizona. Generate concise, formal letters (150 words max each).

Generate exactly 6 institutions and 3 memorial items.

## Institutions (exactly 6)
For each: name, category, deadlineDays, urgency (urgent/soon/later), reasonForDeadline, letter (150 words max, formal business format), evidenceNeeded array.

Priority order:
1. Social Security Administration (urgent)
2. Arizona Dept of Revenue / state benefits
3. Banks/financial institutions
4. Insurance companies
5. Employers/retirement
6. Utilities (APS, SRP, etc.)

## Memorial Items (exactly 3)
1. funeral_home — Brief formal letter to funeral home (100 words)
2. obituary — Warm obituary (100 words)
3. eulogy_opening — Heartfelt eulogy opening (150 words)

Keep all content concise. Use Arizona law references (A.R.S.) where applicable.`,
      output: Output.object({
        schema: generationResponseSchema,
      }),
      messages: [
        {
          role: 'user',
          content: description,
        },
      ],
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[v0] Generation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: `Failed to generate: ${message}` }, { status: 500 })
  }
}
