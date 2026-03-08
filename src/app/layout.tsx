import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fitonist — Daily Workout Tracker",
  description: "Track your fitness journey with a daily selfie and visual streaks.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased bg-app-bg text-text-primary min-h-dvh flex flex-col`}
      >
        <main className="flex-grow flex flex-col w-full max-w-2xl lg:max-w-7xl mx-auto px-4 pt-3 pb-24 md:pb-6">
          {children}
        </main>
      </body>
    </html>
  );
}
