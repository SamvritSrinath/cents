import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
