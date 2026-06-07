import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InterviewAI — AI-Powered Interview Preparation",
    template: "%s | InterviewAI",
  },
  description:
    "Ace your next interview with AI-powered mock interviews, resume analysis, personalized feedback, and coding practice. Used by thousands of engineers worldwide.",
  keywords: [
    "interview preparation",
    "AI interview",
    "mock interview",
    "resume analyzer",
    "coding interview",
    "technical interview",
  ],
  authors: [{ name: "InterviewAI" }],
  creator: "InterviewAI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://interviewai.app",
    title: "InterviewAI — AI-Powered Interview Preparation",
    description: "Ace your next interview with AI-powered preparation tools",
    siteName: "InterviewAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "InterviewAI",
    description: "Ace your next interview with AI",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                fontFamily: "Inter, sans-serif",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
