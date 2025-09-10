"use client"

import { Toast } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { AnimatePresence } from "framer-motion"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence mode="popLayout">
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props} onClose={() => dismiss(id)}>
              <div className="grid gap-1">
                {title && <div className="text-sm font-semibold">{title}</div>}
                {description && (
                  <div className="text-sm opacity-90">{description}</div>
                )}
              </div>
              {action}
            </Toast>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
