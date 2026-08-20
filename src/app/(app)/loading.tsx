export default function AppLoading() {
  return (
    <div className="flex-1 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-muted animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-48 rounded bg-muted/60 animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-16 rounded bg-muted/60 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted/40 animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-muted/40 animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-12 rounded-full bg-muted animate-pulse" />
                <div className="h-5 w-12 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
