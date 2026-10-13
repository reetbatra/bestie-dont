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
        "flex field-sizing-content min-h-24 w-full rounded-[1.25rem] border border-input bg-card px-4 py-3.5 text-base leading-relaxed shadow-soft transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/80 focus-visible:border-apricot focus-visible:ring-4 focus-visible:ring-apricot/15 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
        // room for the mic so typed text never runs underneath it
        "pr-13"
      )}
      {...props}
    />
        <VoiceInputButton
          className="top-2 right-2 translate-y-0"
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
