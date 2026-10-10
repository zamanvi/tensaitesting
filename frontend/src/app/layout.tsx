import type { Metadata } from "next";
import { preconnect } from "react-dom";
import { Sora, Hind_Siliguri, Noto_Sans_JP } from "next/font/google";
import Providers from "@/components/shared/Providers";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Sora only contains Latin letters, so Bangla and Japanese used to fall back to
// whatever font each visitor's device happened to have. These two fill in just those
// scripts (the browser fetches them only when a page actually shows Bangla / Japanese
// text). They are applied on the home page via the .home-type class in globals.css.
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  variable: "--font-bn",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-jp",
  display: "swap",
  weight: ["400", "500", "700"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tensaiconsultancy.com"),
  title: "Tensai — The Way of Global Career",
  description: "The Way of Global Career. Tensai connects verified students with global institutions through a transparent, fraud-proof digital ecosystem.",
  keywords: ["global career", "study abroad", "Japan", "student visa", "agency", "Tensai"],
  openGraph: {
    title: "Tensai — The Way of Global Career",
    description: "The Way of Global Career. Tensai connects verified students with global institutions through a transparent, fraud-proof digital ecosystem.",
    siteName: "Tensai",
    type: "website",
    // No explicit `images` here — the sibling opengraph-image.tsx file
    // convention supplies a branded 1200x630 logo+tagline card and cascades
    // to every route that doesn't define its own override.
  },
  twitter: {
    card: "summary_large_image",
    title: "Tensai — The Way of Global Career",
    description: "The Way of Global Career. Connect. Verify. Succeed.",
  },
};

// The API lives on a different origin (Railway), so the first request normally pays a
// fresh DNS + TCP + TLS handshake. Opening that connection while the page is still
// loading lets the first API call start right away. Purely a hint — if the env var is
// missing/invalid it is skipped and nothing else changes.
function apiOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin;
  } catch {
    return null;
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const api = apiOrigin();
  if (api) preconnect(api, { crossOrigin: "anonymous" });

  return (
    <html lang="en" className="h-full">
      <body className={`${sora.variable} ${hindSiliguri.variable} ${notoSansJP.variable} min-h-full bg-slate-50 text-slate-900 antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
