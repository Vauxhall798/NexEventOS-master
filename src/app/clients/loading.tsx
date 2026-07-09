export default function Loading() {
  return (
    <div className="space-y-6 px-4 py-6 lg:px-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-40 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    </div>
  );
}
