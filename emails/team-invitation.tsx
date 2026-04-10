import { Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from "@react-email/components"

interface TeamInvitationEmailProps {
  organizationName: string
  inviterName: string
  role: string
  inviteLink: string
  isNewUser: boolean
}

const TeamInvitationEmail = ({
  organizationName = "Acme Corporation",
  inviterName = "John Doe",
  role = "member",
  inviteLink = "https://app.resend-it.com/accept-invitation",
  isNewUser = false,
}: TeamInvitationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {isNewUser ? `You've been invited to join ${organizationName}` : `You've been added to ${organizationName}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src="https://kronova.io/kronova-logo-header.png" alt="Kronova" width="150" style={{ width: "150px", height: "auto" }} />
          </Section>

          <Section style={content}>
            <Heading style={heading}>{isNewUser ? "You've been invited!" : "You've been added!"}</Heading>

            <Text style={text}>
              {inviterName} has {isNewUser ? "invited you to join" : "added you to"} <strong>{organizationName}</strong>{" "}
              as a <strong>{role}</strong>.
            </Text>

            {isNewUser ? (
              <>
                <Text style={text}>
                  To accept this invitation and get started with Kronova, please click the button below:
                </Text>
                <Section style={buttonContainer}>
                  <Button style={button} href={inviteLink}>
                    Accept Invitation
                  </Button>
                </Section>
              </>
            ) : (
              <>
                <Text style={text}>
                  You can now access all the features and resources available to your organization.
                </Text>
                <Section style={buttonContainer}>
                  <Button style={button} href={inviteLink}>
                    Go to Dashboard
                  </Button>
                </Section>
              </>
            )}

            <Text style={text}>
              If you have any questions, please don't hesitate to reach out to your organization administrator.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>© 2025 Kronova. All rights reserved.</Text>
            <Text style={footerText}>
              <Link href="https://kronova.io/privacy" style={link}>
                Privacy Policy
              </Link>
              {" · "}
              <Link href="https://kronova.io/terms" style={link}>
                Terms of Service
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TeamInvitationEmail

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
}

const header = {
  padding: "32px 48px",
  borderBottom: "1px solid #e6ebf1",
  textAlign: "center" as const,
}

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0",
}

const content = {
  padding: "48px",
}

const h1 = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "bold",
  marginBottom: "24px",
  lineHeight: "1.3",
}

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "16px",
}

const buttonContainer = {
  margin: "32px 0",
}

const button = {
  backgroundColor: "#0070f3",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
}

const footer = {
  padding: "0 48px",
  borderTop: "1px solid #e6ebf1",
  paddingTop: "24px",
}

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  marginBottom: "8px",
}

const link = {
  color: "#0070f3",
  textDecoration: "underline",
}
