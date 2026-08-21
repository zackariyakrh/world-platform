"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PickerPopupProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function PickerPopup({ open, onClose, children, className }: PickerPopupProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)
  const [render, setRender] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setRender(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => setRender(false), 150)
      return () => clearTimeout(timer)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, onClose])

  if (!render) return null

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-150 ease-out",
        visible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none",
        className
      )}
    >
      {children}
    </div>
  )
}
