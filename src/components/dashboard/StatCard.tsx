import { Card, CardBody } from "@/components/ui/Card";
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "brand" | "slate" | "emerald" | "red" | "amber";
}

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
};

export function StatCard({ label, value, icon, accent = "brand" }: StatCardProps) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={clsx("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", accentClasses[accent])}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-500 dark:text-slate-400" title={label}>{label}</p>
          <p className="truncate text-xl font-semibold text-slate-900 dark:text-slate-100" title={value}>{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
