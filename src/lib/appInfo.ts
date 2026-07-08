// Single source of truth for product/company branding — the app shell
// (Sidebar, browser title, About page, PDF watermark) all read from here so
// the name/version/company never drift out of sync across the app.
//
// Not to be confused with CompanySettings (src/lib/companySettings.ts),
// which holds the *tenant's* own business details (logo, GST, bank details,
// signature) — those appear only inside generated proposals, never in the
// app chrome.
export const APP_INFO = {
  productName: "NexEventOS",
  tagline: "Manage. Quote. Deliver. Grow.",
  version: "v0.9 Pilot",
  company: "NexInt AI",
  website: "https://www.nexintai.com",
  supportEmail: "support@nexintai.com",
} as const;

export function copyrightLine(): string {
  return `© ${new Date().getFullYear()} ${APP_INFO.company}. All Rights Reserved.`;
}
