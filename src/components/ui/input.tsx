"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"
import { VoiceInputButton } from "@/components/ui/voice-input-button"

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

// Dictating an email, URL or phone number is slower and less accurate than
// typing it, so the mic only appears on free-text fields.
const VOICE_TYPES = new Set(["text", "search"])

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { voice?: boolean }>(
  ({ className, type = "text", disabled, voice = true, ...props }, forwardedRef) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const voiceEnabled = voice && VOICE_TYPES.has(type)

    const setRefs = React.useCallback((node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof forwardedRef === "function") forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    }, [forwardedRef])

    const input = (
    <InputPrimitive
      ref={setRefs}
      type={type}
      disabled={disabled}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-full border border-input bg-card px-5 py-1 text-base shadow-soft transition-[border-color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/80 focus-visible:border-apricot focus-visible:ring-4 focus-visible:ring-apricot/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
        voiceEnabled && "pr-12"
      )}
      {...props}
    />
    )

    if (!voiceEnabled) return input
    return (
      <div className="relative w-full">
        {input}
        <VoiceInputButton
          disabled={disabled}
          onTranscript={(text) => {
            const element = inputRef.current
            if (!element) return
            setInputValue(element, `${element.value}${element.value.trim() ? " " : ""}${text}`)
            element.focus()
          }}
        />
      </div>
    )
  },
)
Input.displayName = "Input"

export { Input }
