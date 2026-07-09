import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="space-y-6 px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-72 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-10 w-32 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-28 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="h-5 w-32 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="mt-4 h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>

      <Card className="animate-pulse">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="h-4 w-2/5 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-1/5 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
