import { Card, CardBody } from "@/components/ui/Card";
import { APP_INFO, copyrightLine } from "@/lib/appInfo";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">N</div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{APP_INFO.productName}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{APP_INFO.tagline}</p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <Row label="Version" value={APP_INFO.version} />
          <Row label="Developed by" value={APP_INFO.company} />
          <Row
            label="Website"
            value={
              <a href={APP_INFO.website} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                {APP_INFO.website.replace(/^https?:\/\//, "")}
              </a>
            }
          />
          <Row
            label="Support"
            value={
              <a href={`mailto:${APP_INFO.supportEmail}`} className="text-brand-600 hover:underline">
                {APP_INFO.supportEmail}
              </a>
            }
          />
        </CardBody>
      </Card>

      <p className="text-center text-xs text-slate-400">{copyrightLine()}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}
