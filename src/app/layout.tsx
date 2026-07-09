import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { APP_INFO } from "@/lib/appInfo";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: APP_INFO.productName,
  description: `${APP_INFO.productName} by ${APP_INFO.company} — ${APP_INFO.tagline}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
