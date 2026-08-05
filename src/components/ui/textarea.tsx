"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { VoiceInputButton } from "@/components/ui/voice-input-button"

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
  setter?.call(textarea, value)
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
}

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, disabled, ...props }, forwardedRef) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
    const setRefs = React.useCallback((node: HTMLTextAreaElement | null) => {
      textareaRef.current = node
      if (typeof forwardedRef === "function") forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    }, [forwardedRef])

    return (
      <div className="relative w-full">
    <textarea
      ref={setRefs}
      disabled={disabled}
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
        "pr-10"
      )}
      {...props}
    />
        <VoiceInputButton
          className="top-1.5 -translate-y-0"
          disabled={disabled}
          onTranscript={(text) => {
            const element = textareaRef.current
            if (!element) return
            setTextareaValue(element, `${element.value}${element.value.trim() ? " " : ""}${text}`)
            element.focus()
          }}
        />
      </div>
    )
  },
)
Textarea.displayName = "Textarea"

export { Textarea }
