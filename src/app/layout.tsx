import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/themeProvider";
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Neon IPTV Player",
  description: "Личный IPTV плеер",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider
            style={{ "--sidebar-width": "20rem" } as React.CSSProperties}
          >
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
