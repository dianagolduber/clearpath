export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[v0] SMS route received request body:', JSON.stringify(body, null, 2))

    const { messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('[v0] No messages in request')
      return Response.json(
        { error: 'No messages to send' },
        { status: 400 }
      )
    }

    console.log('[v0] Processing', messages.length, 'messages')

    const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim()
    const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim()
    let fromPhone = (process.env.TWILIO_PHONE_NUMBER || '').trim()

    // Ensure From phone has + prefix
    if (fromPhone && !fromPhone.startsWith('+')) {
      fromPhone = '+' + fromPhone.replace(/\D/g, '')
    }

    console.log('[v0] Twilio config - SID:', accountSid ? accountSid.substring(0, 8) + '...' : 'MISSING', ', Token exists:', !!authToken, ', From:', fromPhone)

    if (!accountSid || !authToken || !fromPhone) {
      console.error('[v0] Missing Twilio credentials - SID:', !!accountSid, 'Token:', !!authToken, 'From:', !!fromPhone)
      return Response.json(
        { error: 'SMS service not configured. Missing: ' + [!accountSid && 'TWILIO_ACCOUNT_SID', !authToken && 'TWILIO_AUTH_TOKEN', !fromPhone && 'TWILIO_PHONE_NUMBER'].filter(Boolean).join(', ') },
        { status: 500 }
      )
    }

    // Build and validate URL before the loop
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    console.log('[v0] Twilio API URL:', twilioUrl)

    const results = []

    for (const msg of messages) {
      const { to, name, taskDetails, deceasedName, taskCount } = msg

      // Format phone number: remove non-digits and ensure US format with + prefix
      const cleanPhone = (to || '').replace(/\D/g, '')
      let phoneNumber = cleanPhone.length === 10 ? `+1${cleanPhone}` : cleanPhone.length === 11 ? `+${cleanPhone}` : `+${cleanPhone}`
      
      // Validate phone number format
      if (!phoneNumber.startsWith('+') || phoneNumber.length < 11) {
        console.error('[v0] Invalid phone number format:', to, '->', phoneNumber)
        results.push({
          to,
          name,
          success: false,
          error: `Invalid phone number format: ${to}`,
        })
        continue
      }

      const smsBody = `Hi ${name}, you've been assigned ${taskCount} task${taskCount !== 1 ? 's' : ''} for ${deceasedName}:\n\n${taskDetails}\n\nLetters are ready in Aftermath. — Aftermath`

      try {
        const auth = btoa(`${accountSid}:${authToken}`)
        
        console.log('[v0] Sending SMS to:', phoneNumber, 'from:', fromPhone)
        console.log('[v0] SMS body length:', smsBody.length, 'chars')

        const response = await fetch(
          twilioUrl,
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

        console.log('[v0] Twilio response status:', response.status, response.statusText)
        
        const data = await response.json()
        console.log('[v0] Twilio response body:', JSON.stringify(data, null, 2))

        if (!response.ok) {
          console.error('[v0] Twilio error - code:', data.code, 'message:', data.message, 'moreInfo:', data.more_info)
          results.push({
            to: phoneNumber,
            name,
            success: false,
            error: data.message || data.error_message || `Twilio error ${data.code}: ${data.message}`,
            twilioCode: data.code,
            twilioMoreInfo: data.more_info,
          })
        } else {
          console.log('[v0] SMS sent successfully, SID:', data.sid)
          results.push({
            to: phoneNumber,
            name,
            success: true,
            messageSid: data.sid,
          })
        }
      } catch (err) {
        console.error('[v0] Error sending SMS to', to, '- error:', err)
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
    
    console.log('[v0] SMS send complete - sent:', results.length - failedCount, 'failed:', failedCount)
    
    if (failedCount > 0) {
      const firstError = failedResults[0]
      console.warn(`[v0] ${failedCount} of ${results.length} SMS messages failed. First error:`, firstError)
      return Response.json(
        {
          error: `${failedCount} message(s) failed: ${firstError?.error || 'Unknown error'}`,
          results,
          sent: results.length - failedCount,
        },
        { status: 207 }
      )
    }

    console.log('[v0] All SMS messages sent successfully')
    return Response.json({ success: true, results, sent: results.length })
  } catch (err) {
    console.error('[v0] SMS API top-level error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to process SMS request' },
      { status: 500 }
    )
  }
}
