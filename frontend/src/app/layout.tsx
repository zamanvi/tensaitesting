import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/shared/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tensai — The Way of Global Career",
  description: "Connect with global institutions, verify your credentials, and unlock your international career journey.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-slate-50 text-slate-900 antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
