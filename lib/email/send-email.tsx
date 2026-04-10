import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY || process.env.RESENDIT_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://v0-resendit-rspc.vercel.app"
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  if (!resend) {
    console.warn(
      "[v0] Resend not configured - skipping email send. Please set RESEND_API_KEY or RESENDIT_API_KEY environment variable.",
    )
    return { success: false, error: "Resend API key not configured" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || "Kronova <no-reply@updates.kronova.io>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error("[v0] Error sending email:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Email sent successfully:", data?.id)
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Error sending email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send a team invitation email
 */
export async function sendTeamInvitation({
  to,
  organizationName,
  inviterName,
  role,
  inviteLink,
  isNewUser,
}: {
  to: string
  organizationName: string
  inviterName: string
  role: string
  inviteLink: string
  isNewUser: boolean
}) {
  const logoUrl = `${getSiteUrl()}/icons/email-logo.png`

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 64px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px;">
            <!-- Header with Logo -->
            <tr>
              <td style="padding: 32px 48px; border-bottom: 1px solid #e6ebf1;">
                <img src="${logoUrl}" alt="Kronova" style="height: 40px; width: auto; display: block;" />
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 48px;">
                <h2 style="color: #1a1a1a; font-size: 28px; font-weight: bold; margin: 0 0 24px 0; line-height: 1.3;">
                  ${isNewUser ? "You've been invited!" : "You've been added!"}
                </h2>
                
                <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                  <strong>${inviterName}</strong> has ${isNewUser ? "invited you to join" : "added you to"} <strong>${organizationName}</strong> as a <strong>${role}</strong>.
                </p>
                
                <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                  ${isNewUser ? "To accept this invitation and get started with Kronova, please click the button below:" : "You can now access all the features and resources available to your organization."}
                </p>
                
                <table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                  <tr>
                    <td align="center">
                      <a href="${inviteLink}" style="background-color: #0070f3; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: 600; padding: 12px 24px; text-decoration: none;">
                        ${isNewUser ? "Accept Invitation" : "Go to Dashboard"}
                      </a>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 0;">
                  If you have any questions, please don't hesitate to reach out to your organization administrator.
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 0 48px 48px 48px; border-top: 1px solid #e6ebf1; padding-top: 24px;">
                <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 0 0 8px 0;">
                  © 2026 Kronova. All rights reserved.
                </p>
                <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 0;">
                  <a href="https://kronova.io/privacy" style="color: #0070f3; text-decoration: underline;">Privacy Policy</a>
                  ·
                  <a href="https://kronova.io/terms" style="color: #0070f3; text-decoration: underline;">Terms of Service</a>
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

  return sendEmail({
    to,
    subject: isNewUser ? `You've been invited to join ${organizationName}` : `You've been added to ${organizationName}`,
    html,
  })
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail({
  to,
  userName,
  organizationName,
  dashboardLink,
}: {
  to: string
  userName: string
  organizationName?: string
  dashboardLink: string
}) {
  const logoUrl = `${getSiteUrl()}/email-logo.png`

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 64px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px;">
            <!-- Header with Logo -->
            <tr>
              <td style="padding: 32px 48px; border-bottom: 1px solid #e6ebf1;">
                <img src="${logoUrl}" alt="Kronova" style="height: 40px; width: auto; display: block;" />
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 48px;">
                <h2 style="color: #1a1a1a; font-size: 28px; font-weight: bold; margin: 0 0 24px 0; line-height: 1.3;">
                  Welcome to Kronova!
                </h2>
                
                <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                  Hi <strong>${userName}</strong>,
                </p>
                
                <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                  Welcome to Kronova${organizationName ? ` and ${organizationName}` : ""}! We're excited to have you on board.
                </p>
                
                <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                  Get started by exploring your dashboard and discovering all the powerful features available to you.
                </p>
                
                <table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                  <tr>
                    <td align="center">
                      <a href="${dashboardLink}" style="background-color: #0070f3; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: 600; padding: 12px 24px; text-decoration: none;">
                        Go to Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 0;">
                  If you have any questions or need help getting started, feel free to reach out to our support team.
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 0 48px 48px 48px; border-top: 1px solid #e6ebf1; padding-top: 24px;">
                <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 0 0 8px 0;">
                  © 2025 Resend-It. All rights reserved.
                </p>
                <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 0;">
                  <a href="https://resend-it.com/privacy" style="color: #0070f3; text-decoration: underline;">Privacy Policy</a>
                  ·
                  <a href="https://resend-it.com/terms" style="color: #0070f3; text-decoration: underline;">Terms of Service</a>
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

  return sendEmail({
    to,
    subject: "Welcome to Kronova",
    html,
  })
}
