import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";
import { nunito } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";
import { InstallProvider } from "@/components/pwa/install-provider";
import { PerfProbe } from "@/components/perf/perf-probe";
import "./globals.css";

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const description = "The friend who takes your phone. No contact, but make it survivable.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "bestie, don't.", template: "%s · bestie, don't." },
  description,
  applicationName: "bestie, don't.",
  openGraph: {
    type: "website",
    siteName: "bestie, don't.",
    title: "bestie, don't.",
    description,
  },
  twitter: { card: "summary_large_image", title: "bestie, don't.", description },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "bestie, don't.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF4EA" },
    { media: "(prefers-color-scheme: dark)", color: "#FBF4EA" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV === "development"}>
          <InstallProvider>
            {children}
            <Toaster />
            {/* Renders nothing unless NEXT_PUBLIC_PROFILE=1. */}
            <PerfProbe />
          </InstallProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
