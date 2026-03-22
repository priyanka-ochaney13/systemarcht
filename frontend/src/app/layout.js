import { Suspense } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import { CustomLoader } from "@/components/common/CustomLoader";
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
  title: "SystemArcht - AWS Architecture Learning Platform",
  description: "Design, simulate, and learn cloud architectures with real-world system design patterns",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <Suspense fallback={<CustomLoader />}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
