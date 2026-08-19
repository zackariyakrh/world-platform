import { getBrandingSettings } from "@/lib/settings"
import {
  Zap,
  MessageSquare,
  Calendar,
  CheckSquare,
  Sparkles,
} from "lucide-react"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const branding = await getBrandingSettings()

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ─── Branded Panel (Light: beige/red gradient) ───────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[oklch(0.45_0.18_25)] via-[oklch(0.38_0.15_35)] to-[oklch(0.42_0.20_15)] p-10 lg:flex lg:w-[45%] xl:w-[48%]">
        {/* Animated glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-32 -top-32 size-96 rounded-full opacity-40"
            style={{
              background: "radial-gradient(circle, oklch(0.60 0.22 25 / 0.5), transparent 70%)",
              animation: "glow-drift 12s ease-in-out infinite",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute -bottom-24 -right-24 size-80 rounded-full opacity-30"
            style={{
              background: "radial-gradient(circle, oklch(0.55 0.20 40 / 0.4), transparent 70%)",
              animation: "glow-drift 16s ease-in-out infinite reverse",
              filter: "blur(50px)",
            }}
          />
          <div
            className="absolute left-1/2 top-1/3 size-64 -translate-x-1/2 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, oklch(0.50 0.18 15 / 0.3), transparent 70%)",
              animation: "glow-drift 20s ease-in-out infinite 3s",
              filter: "blur(40px)",
            }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(oklch(1 0 0 / 0.4) 1px, transparent 1px),
                linear-gradient(90deg, oklch(1 0 0 / 0.4) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute size-1 rounded-full bg-white/25"
              style={{
                left: `${15 + i * 15}%`,
                bottom: "10%",
                animation: `particle-float ${8 + i * 2}s linear infinite`,
                animationDelay: `${i * 1.5}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="flex size-11 items-center justify-center rounded-xl backdrop-blur-sm"
              style={{
                background: "oklch(1 0 0 / 0.1)",
                border: "1px solid oklch(1 0 0 / 0.15)",
                boxShadow: "0 0 20px oklch(0.55 0.20 25 / 0.3), inset 0 0 20px oklch(1 0 0 / 0.05)",
                animation: "glow-breathe 4s ease-in-out infinite",
              }}
            >
              <Zap className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white glow-text">{branding.appName}</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-10">
          <div>
            <h2
              className="text-3xl font-bold leading-tight text-white xl:text-4xl"
              style={{ textShadow: "0 0 40px oklch(0.55 0.20 25 / 0.3)" }}
            >
              Where teams come
              <br />
              <span
                className="bg-gradient-to-r from-[oklch(0.85_0.15_25)] via-[oklch(0.80_0.18_40)] to-[oklch(0.85_0.12_15)] bg-clip-text text-transparent"
                style={{
                  backgroundSize: "200% auto",
                  animation: "gradient-shift 6s ease infinite",
                }}
              >
                together to build.
              </span>
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/70">
              {branding.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                style={{
                  animation: `float ${5 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover:shadow-lg"
                  style={{
                    background: "oklch(1 0 0 / 0.1)",
                    boxShadow: "0 0 0 1px oklch(1 0 0 / 0.05)",
                  }}
                >
                  <feature.icon className="size-4 text-white/80 group-hover:text-white group-hover:drop-shadow-[0_0_8px_oklch(1_0_0_/_0.5)]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-white">{feature.title}</span>
                  <span className="text-xs text-white/60">{feature.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/50">
          © {new Date().getFullYear()} {branding.appName}. All rights reserved.
        </div>
      </div>

      {/* ─── Form Panel ──────────────────────────────────────── */}
      <div className="glow-bg flex flex-1 items-center justify-center bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  )
}

const features = [
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Team messaging",
  },
  {
    icon: Calendar,
    title: "Calendar",
    description: "Event scheduling",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    description: "Track progress",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description: "Smart suggestions",
  },
]
