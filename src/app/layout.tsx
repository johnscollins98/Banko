import type { Metadata, Viewport } from "next";
import { PullToRefresh } from "./_components/pull-to-refresh";
import { Theme } from "./_components/Theme";
import { TimezoneSync } from "./_components/timezone-sync";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Banko",
  description: "Application to help budget with my bank",
  icons: "/icon.png",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="relative flex flex-col">
        <Providers>
          <TimezoneSync />
          <PullToRefresh />
          <Theme>{children}</Theme>
        </Providers>
      </body>
    </html>
  );
}
