"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Zap, Eye, EyeOff, Loader2, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginValues) {
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password. Please try again.")
        return
      }

      toast.success("Welcome back!")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 lg:hidden">
        <div
          className="flex size-12 items-center justify-center rounded-2xl bg-primary shadow-[0_0_30px_oklch(from_var(--primary)_l_c_h_/_0.3),0_0_60px_oklch(from_var(--primary)_l_c_h_/_0.15)]"
        >
          <Zap className="size-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight glow-text">Nexus</span>
      </div>

      <div className="flex flex-col gap-3 text-center">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-semibold tracking-tight text-foreground glow-text">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <LogIn className="size-5 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          </div>
          Welcome back
        </h1>
        <p className="text-base text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            aria-invalid={!!errors.email}
            className="glow-input transition-all duration-300"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading}
              aria-invalid={!!errors.password}
              className="glow-input pr-10 transition-all duration-300"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-base font-normal text-muted-foreground">
            Remember me for 30 days
          </Label>
        </div>

        <Button type="submit" className="w-full h-11 text-base font-semibold glow-button" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-base text-muted-foreground">
        Account access is managed by your administrator.
        <br />
        Contact your admin to get an account created.
      </p>
    </div>
  )
}
