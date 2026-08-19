import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="glow-bg flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div className="text-[10rem] font-bold leading-none text-muted/60 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-muted">
              <SearchX className="size-10 text-muted-foreground drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.3)]" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            Page not found
          </h1>
          <p className="text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>

        <Button render={<Link href="/dashboard" />}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
