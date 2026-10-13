import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";
import { caveat, quicksand } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";
import { InstallProvider } from "@/components/pwa/install-provider";
import { PerfProbe } from "@/components/perf/perf-probe";
import "./globals.css";

export const metadata: Metadata = {
  title: "bestie, don't.",
  description: "The friend who takes your phone. No contact, but make it survivable.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "bestie, don't.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#FFFFFF" },
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
      className={`${caveat.variable} ${quicksand.variable} h-full antialiased`}
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
