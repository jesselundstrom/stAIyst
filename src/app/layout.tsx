import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "stAIyst - AI-assisted styling",
  description: "Upload a photo, get real clothing recommendations, and preview items on yourself.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "stAIyst",
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#fafaf9] text-neutral-900">
        <ServiceWorkerRegistration />
        <Header />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
