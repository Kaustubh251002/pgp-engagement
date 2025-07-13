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

export const metadata = {
  title: "Lie Detector Leaderboard | Truth Seekers Championship",
  description: "Track the ultimate truth seekers! See who's the best at detecting lies in our interactive leaderboard. Real-time updates, accuracy stats, and competitive rankings.",
  keywords: "lie detector, leaderboard, truth, accuracy, game, competition, ranking",
  author: "PGP Engagement",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8b5cf6" },
    { media: "(prefers-color-scheme: dark)", color: "#a78bfa" }
  ],
  colorScheme: "light dark",
  robots: "index, follow",
  openGraph: {
    title: "Lie Detector Leaderboard",
    description: "See who's the ultimate truth seeker in our lie detection game!",
    type: "website",
    siteName: "Truth Seekers Championship"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#8b5cf6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#a78bfa" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
