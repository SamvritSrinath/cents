/**
 * @fileoverview Root layout for the Cents application.
 * Sets up fonts, metadata, providers, and global styles.
 * 
 * @module app/layout
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/** Geist Sans font configuration */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
});

/** Geist Mono font configuration */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Application metadata for SEO */
export const metadata: Metadata = {
  title: "Cents - Privacy-First Expense Tracking",
  description: "Track your expenses, manage budgets, and gain insights into your spending habits. Free, private, and open source.",
  keywords: ["expense tracker", "budgeting", "personal finance", "money management"],
  authors: [{ name: "Cents" }],
  openGraph: {
    title: "Cents - Privacy-First Expense Tracking",
    description: "Track your expenses, manage budgets, and gain insights into your spending habits.",
    type: "website",
  },
};

/**
 * Root layout component wrapping all pages.
 * Provides global context (React Query, themes) to the app.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
