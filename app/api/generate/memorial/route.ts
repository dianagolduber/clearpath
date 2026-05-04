import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { memorialResponseSchema } from '@/lib/types'

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
      model: openai('gpt-4o-mini'),
      system: `You are a compassionate memorial writing assistant. Generate heartfelt, personalized memorial content.

Generate exactly 3 memorial items:
1. funeral_home — Brief formal letter to funeral home (80 words)
2. obituary — Warm obituary (100 words)
3. eulogy_opening — Heartfelt eulogy opening (120 words)`,
      schema: memorialResponseSchema,
      messages: [
        {
          role: 'user',
          content: description,
        },
      ],
    })

    return Response.json({
      memorialItems: object?.memorialItems ?? [],
    })
  } catch (error) {
    console.error('[v0] Memorial generation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: `Failed to generate: ${message}` }, { status: 500 })
  }
}
