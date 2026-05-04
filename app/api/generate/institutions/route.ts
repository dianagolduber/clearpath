import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { institutionsResponseSchema } from '@/lib/types'

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

    const { object } = await generateObject({
      model: openai('anthropic/claude-3-5-haiku'),
      system: `You are a compassionate estate administration assistant. Generate very concise, formal letters (100 words max each).

Generate exactly 3 institutions.

## Institutions (exactly 3)
For each: name, category, deadlineDays, urgency (urgent/soon/later), reasonForDeadline, letter (100 words max, formal business format), evidenceNeeded array.

Priority order:
1. Social Security Administration (urgent)
2. Banks/financial institutions
3. Insurance companies

Keep all content very concise. Use relevant state laws and regulations where applicable.`,
      schema: institutionsResponseSchema,
      messages: [
        {
          role: 'user',
          content: description,
        },
      ],
    })

    return Response.json({
      institutions: object?.institutions ?? [],
    })
  } catch (error) {
    console.error('[v0] Institutions generation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: `Failed to generate: ${message}` }, { status: 500 })
  }
}
