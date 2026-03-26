import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "stAIyst — AI-assisted styling",
  description: "Upload a photo, get real clothing recommendations, and preview items on yourself.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#fafaf9] text-neutral-900">
        <Header />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
