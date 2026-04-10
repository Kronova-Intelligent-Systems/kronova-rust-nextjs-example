import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text } from "@react-email/components"

interface WelcomeEmailProps {
  userName: string
  organizationName?: string
  dashboardLink: string
}

export const WelcomeEmail = ({
  userName = "there",
  organizationName,
  dashboardLink = "https://app.resend-it.com/dashboard",
}: WelcomeEmailProps) => {
  const logo = {
    width: "150",
    height: "auto",
  };

  return (
    <Html>
      <Head />
      <Preview>Welcome to Kronova - Your AI-Powered Asset Management Platform</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src="https://kronova.io/kronova-logo-header.png" alt="Kronova" width="150" style={logo} />
          </Section>

          <Section style={content}>
            <Heading style={h1}>Welcome to Kronova!</Heading>

            <Text style={text}>Hi {userName},</Text>

            <Text style={text}>
              Thank you for joining Kronova, the enterprise-grade AI-powered asset management and workflow automation
              platform.
              {organizationName && ` You're now part of ${organizationName}.`}
            </Text>

            <Text style={text}>Here's what you can do with Kronova:</Text>

            <ul style={list}>
              <li style={listItem}>
                <strong>Manage Assets:</strong> Track and organize your digital and physical assets with blockchain
                integration
              </li>
              <li style={listItem}>
                <strong>AI Agents:</strong> Create intelligent agents to automate complex workflows
              </li>
              <li style={listItem}>
                <strong>Workflow Automation:</strong> Build powerful workflows with no-code visual editor
              </li>
              <li style={listItem}>
                <strong>Analytics & Insights:</strong> Get AI-powered insights into your operations
              </li>
              <li style={listItem}>
                <strong>Team Collaboration:</strong> Work seamlessly with your team
              </li>
            </ul>

            <Section style={buttonContainer}>
              <Button style={button} href={dashboardLink}>
                Go to Dashboard
              </Button>
            </Section>

            <Text style={text}>
              Need help getting started? Check out our{" "}
              <a href="https://docs.kronova.io" style={link}>
                documentation
              </a>{" "}
              or reach out to our support team.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>© 2025 Kronova. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

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

const logo = {
  margin: "0 auto",
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

const list = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "16px",
  paddingLeft: "20px",
}

const listItem = {
  marginBottom: "12px",
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
