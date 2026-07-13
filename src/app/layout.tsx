import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { APP_INFO } from "@/lib/appInfo";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: APP_INFO.productName,
  description: `${APP_INFO.productName} by ${APP_INFO.company} — ${APP_INFO.tagline}`,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function() {
  try {
    var stored = window.localStorage.getItem('theme');
    // default to light when no stored preference exists
    var theme = stored === 'light' || stored === 'dark' ? stored : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {
    // ignore
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AuthSessionProvider>
          <ThemeProvider>
            <ToastProvider>
              <DashboardShell>{children}</DashboardShell>
            </ToastProvider>
          </ThemeProvider>
        </AuthSessionProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
