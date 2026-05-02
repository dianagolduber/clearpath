export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { emails } = body

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ error: 'No emails to send' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'Email service not configured. Missing RESEND_API_KEY' }, { status: 500 })
    }

    const results = []

    for (const email of emails) {
      const { to, name, institutionName, deadlineDays, deceasedName, letter } = email

      if (!to || !to.includes('@')) {
        results.push({ to, name, success: false, error: 'Invalid email address' })
        continue
      }

      const htmlBody = `
        <p>Hi ${name},</p>
        <p>You've been assigned to handle <b>${institutionName}</b> for ${deceasedName}.</p>
        <p><b>Deadline: ${deadlineDays} days</b></p>
        <p>Here's your letter:</p>
        <pre style="background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap; font-family: monospace; font-size: 13px;">${letter}</pre>
        <p>— Aftermath</p>
      `

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Aftermath <aftermath@resend.dev>',
            to: [to],
            subject: `You're handling ${institutionName} for ${deceasedName}`,
            html: htmlBody,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          results.push({
            to,
            name,
            success: false,
            error: data.message || data.error || 'Failed to send email',
          })
        } else {
          results.push({
            to,
            name,
            success: true,
            emailId: data.id,
          })
        }
      } catch (err) {
        results.push({
          to,
          name,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const failedResults = results.filter(r => !r.success)
    const failedCount = failedResults.length

    if (failedCount > 0) {
      const firstError = failedResults[0]
      return Response.json(
        {
          error: `${failedCount} email(s) failed: ${firstError?.error || 'Unknown error'}`,
          results,
          sent: results.length - failedCount,
        },
        { status: 207 }
      )
    }

    return Response.json({ success: true, results, sent: results.length })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to process email request' },
      { status: 500 }
    )
  }
}
