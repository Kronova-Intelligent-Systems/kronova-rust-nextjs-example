import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { RSPCQueryProvider } from "@/lib/rspc/provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Kronova - Intelligent Asset Systems",
  description:
    "Enterprise Asset Intelligence Platform with AI-powered analytics and blockchain tokenization for real-world assets",
  generator: "Kronova v2.0.0",
  manifest: "/manifest.json",
  keywords: [
    "asset management",
    "AI",
    "enterprise",
    "blockchain",
    "analytics",
    "asset intelligence",
    "tokenization",
    "Kronova",
  ],
  authors: [{ name: "Kronova Team" }],
  creator: "Kronova",
  publisher: "Kronova",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://kronova.io"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kronova - Intelligent Asset Systems",
    description:
      "Enterprise Asset Intelligence Platform with AI-powered analytics and blockchain tokenization for real-world assets",
    url: "https://app.kronova.io",
    siteName: "Kronova",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kronova Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronova - Intelligent Asset Systems",
    description:
      "Enterprise Asset Intelligence Platform with AI-powered analytics and blockchain tokenization for real-world assets",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icon-180x180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kronova",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0088CC" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kronova" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0088CC" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-180x180.png" />
        <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js" async />
      </head>
      <body className={`font-sans ${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center neural-grid">
                <div className="animate-pulse text-primary">Loading Kronova...</div>
              </div>
            }
          >
            <RSPCQueryProvider>{children}</RSPCQueryProvider>
            <Analytics />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}
