import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextAuthProvider } from "./providers";
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
  title: {
    default: "BCA Market",
    template: "%s | BCA Market",
  },
  description: "Trade on real school events. See where the community stands before outcomes are decided.",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    siteName: "BCA Market",
    type: "website",
    locale: "en-US",
  },
  twitter: {
    card: "summary"
  },
  robots: {
    index: false,
    follow: false,
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
    // <div>
    //   Under Maintenance. Please check back later.
    // </div>
  );
}
