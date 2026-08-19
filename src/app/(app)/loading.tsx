import { Zap } from "lucide-react"

export default function AppLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          <div
            className="flex size-16 items-center justify-center rounded-2xl bg-primary animate-pulse"
            style={{
              boxShadow:
                "0 0 30px oklch(from var(--primary) l c h / 0.3), 0 0 60px oklch(from var(--primary) l c h / 0.15)",
            }}
          >
            <Zap className="size-8 text-primary-foreground" />
          </div>
          <div
            className="absolute inset-0 rounded-2xl animate-ping opacity-20"
            style={{ background: "var(--primary)" }}
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Nexus
          </span>
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <div className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <div className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  )
}
