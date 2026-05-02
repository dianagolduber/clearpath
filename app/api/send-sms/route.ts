export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'No messages to send' },
        { status: 400 }
      )
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromPhone = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromPhone) {
      console.error('[v0] Missing Twilio credentials')
      return Response.json(
        { error: 'SMS service not configured' },
        { status: 500 }
      )
    }

    const results = []

    for (const msg of messages) {
      const { to, name, taskDetails, deceasedName, taskCount } = msg

      // Format phone number: remove non-digits and ensure US format
      const cleanPhone = to.replace(/\D/g, '')
      const phoneNumber = cleanPhone.length === 10 ? `+1${cleanPhone}` : `+${cleanPhone}`

      const smsBody = `Hi ${name}, you've been assigned ${taskCount} task${taskCount !== 1 ? 's' : ''} for ${deceasedName}:\n\n${taskDetails}\n\nLetters are ready in Aftermath. — Aftermath`

      try {
        const auth = btoa(`${accountSid}:${authToken}`)

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: phoneNumber,
              From: fromPhone,
              Body: smsBody,
            }).toString(),
          }
        )

        const data = await response.json()

        if (!response.ok) {
          console.error('[v0] Twilio error:', data)
          results.push({
            to: phoneNumber,
            name,
            success: false,
            error: data.message || 'Failed to send SMS',
          })
        } else {
          results.push({
            to: phoneNumber,
            name,
            success: true,
            messageSid: data.sid,
          })
        }
      } catch (err) {
        console.error('[v0] Error sending SMS to', to, err)
        results.push({
          to,
          name,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const failedCount = results.filter(r => !r.success).length
    if (failedCount > 0) {
      console.warn(`[v0] ${failedCount} of ${results.length} SMS messages failed to send`)
      return Response.json(
        {
          error: `${failedCount} message(s) failed to send`,
          results,
        },
        { status: 207 }
      )
    }

    console.log('[v0] All SMS messages sent successfully')
    return Response.json({ success: true, results, count: results.length })
  } catch (err) {
    console.error('[v0] SMS API error:', err)
    return Response.json(
      { error: 'Failed to process SMS request' },
      { status: 500 }
    )
  }
}
