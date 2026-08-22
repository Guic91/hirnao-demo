import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { BottomNav } from "@/components/layout/bottom-nav";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hirnao — Organisez vos sorties",
  description:
    "Coordonnez vos rencontres entre amis et contacts professionnels. Disponibilités, propositions et confirmations en un seul endroit.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hirnao",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${dmSans.variable} h-full`}>
      <body className="min-h-full bg-white text-stone-900 antialiased">
        <AppProvider>
          <div className="mx-auto min-h-full max-w-lg">
            <main className="pb-nav">{children}</main>
            <BottomNav />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
