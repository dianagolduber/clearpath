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

    // Use NEXT_PUBLIC_URL from environment for production URL
    const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://v0-aftermath.vercel.app'

    const results = []

    for (const email of emails) {
      // Support both old format (single assignment) and new format (tasks array)
      const { to, name, deceasedName, tasks, institutionName, deadlineDays, letter } = email
      
      if (!to || !to.includes('@')) continue

      // Build assignments array from either format
      const assignments: { institutionName: string; deadlineDays: number; letter: string }[] = 
        tasks && Array.isArray(tasks) 
          ? tasks 
          : institutionName 
            ? [{ institutionName, deadlineDays: deadlineDays || 0, letter: letter || '' }]
            : []

      if (assignments.length === 0) continue

      // Sort assignments by deadline (most urgent first)
      assignments.sort((a, b) => a.deadlineDays - b.deadlineDays)

      // Build assignment sections
      const assignmentSections = assignments.map(a => {
        const isUrgent = a.deadlineDays > 0 && a.deadlineDays < 14
        const isWarning = a.deadlineDays >= 14 && a.deadlineDays < 60
        const badgeColor = isUrgent ? '#dc2626' : isWarning ? '#d97706' : '#059669'
        const badgeBg = isUrgent ? '#fef2f2' : isWarning ? '#fffbeb' : '#ecfdf5'
        
        // Calculate deadline date for calendar link
        const deadlineDate = new Date()
        deadlineDate.setDate(deadlineDate.getDate() + a.deadlineDays)
        const calendarDate = deadlineDate.toISOString().split('T')[0].replace(/-/g, '')
        const calendarTitle = encodeURIComponent(`Send ${a.institutionName} letter`)
        const calendarDetails = encodeURIComponent(`Letter for ${deceasedName}`)
        const calendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&dates=${calendarDate}/${calendarDate}&details=${calendarDetails}`

        // Generate letter URL with encoded data
        const letterData = {
          institutionName: a.institutionName,
          deadlineDays: a.deadlineDays,
          letter: a.letter,
          deceasedName,
        }
        const encodedData = encodeURIComponent(btoa(JSON.stringify(letterData)))
        const letterUrl = `${siteUrl}/letter/${encodedData}`

        const deadlineText = a.deadlineDays === 0 
          ? 'When ready' 
          : a.deadlineDays === 1 
            ? '1 day' 
            : `${a.deadlineDays} days`

        return `
          <div style="margin-bottom: 24px; border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden;">
            <div style="padding: 20px; background: #fafafa;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 600; color: #171717;">${a.institutionName}</span>
                  </td>
                  <td align="right">
                    ${a.deadlineDays > 0 ? `
                      <span style="display: inline-block; padding: 4px 12px; background: ${badgeBg}; color: ${badgeColor}; font-size: 13px; font-weight: 500; border-radius: 20px;">
                        ${deadlineText}
                      </span>
                    ` : `
                      <span style="display: inline-block; padding: 4px 12px; background: #f3f4f6; color: #6b7280; font-size: 13px; font-weight: 500; border-radius: 20px;">
                        When ready
                      </span>
                    `}
                  </td>
                </tr>
              </table>
              
              <p style="margin: 16px 0 20px; font-size: 14px; color: #6b7280; line-height: 1.5;">
                Your letter is ready. Click below to view, edit, and copy it.
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right: 12px;">
                    <a href="${letterUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background: #171717; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 8px;">
                      View &amp; Edit Your Letter &rarr;
                    </a>
                  </td>
                  ${a.deadlineDays > 0 ? `
                    <td>
                      <a href="${calendarLink}" target="_blank" style="display: inline-block; padding: 12px 20px; background: #ffffff; color: #171717; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 8px; border: 1px solid #e5e5e5;">
                        Add to Calendar
                      </a>
                    </td>
                  ` : ''}
                </tr>
              </table>
            </div>
          </div>
        `
      }).join('')

      const taskCount = assignments.length
      const subject = `Your tasks for ${deceasedName}'s estate`

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAF7F2;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 400; color: #171717; margin-bottom: 8px;">
                        Aftermath
                      </div>
                      <div style="font-size: 14px; color: #737373;">
                        Handling affairs for <strong style="color: #171717;">${deceasedName}</strong>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Hi ${name},
                      </p>
                      <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #374151;">
                        You've been assigned ${taskCount === 1 ? 'a task' : `${taskCount} tasks`} to help with ${deceasedName}'s estate. Each letter below is ready — click to view, edit, and copy.
                      </p>
                      
                      ${assignmentSections}
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background: #fafafa; border-top: 1px solid #e5e5e5; border-radius: 0 0 16px 16px;">
                      <p style="margin: 0; font-size: 13px; color: #737373; text-align: center;">
                        Sent by <strong>Aftermath</strong> — handling what comes after
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
            subject,
            html: htmlBody,
          }),
        })

        const responseData = await response.json()

        if (!response.ok) {
          results.push({
            to,
            name,
            success: false,
            error: responseData.message || responseData.error || 'Failed to send email',
          })
        } else {
          results.push({
            to,
            name,
            success: true,
            emailId: responseData.id,
            assignmentCount: assignments.length,
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
