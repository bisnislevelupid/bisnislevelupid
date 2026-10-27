export default function ResourceLoading() {
  return (
    <div className="space-y-3" aria-busy="true">
      <p className="text-sm text-muted-foreground">Memuat data…</p>
      <div className="h-10 animate-pulse rounded-md bg-slate-200" />
      <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
    </div>
  );
}
