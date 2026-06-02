import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AutoLockProvider } from "@/components/providers/AutoLockProvider";
import { VaultGuard } from "@/components/providers/VaultGuard";
import { ToastContainer } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FamilyVault — Private Family Security Vault",
  description: "Stop reusing passwords. Move to unique strong passwords step by step with client-side encryption.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FamilyVault",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full antialiased bg-slate-950 text-slate-200">
        <AuthProvider>
          <AutoLockProvider>
            <VaultGuard>
              {children}
            </VaultGuard>
            <ToastContainer />
          </AutoLockProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
