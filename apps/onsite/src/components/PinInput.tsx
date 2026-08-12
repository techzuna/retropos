"use client";

import { useEffect, useRef } from "react";

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  length?: number;
  autoFocus?: boolean;
  /** Entry is in flight: input is ignored, but focus is deliberately kept. */
  busy?: boolean;
  label: string;
  /** Rendered under the boxes and announced with them (e.g. an error). */
  describedById?: string;
  invalid?: boolean;
}

/**
 * PIN entry as one box per digit. The value is a digit-prefix string: boxes
 * fill left to right, backspace peels from the right, focus follows the
 * next empty box, and pasting a full code fills everything.
 */
export function PinInput({
  value,
  onChange,
  length = 4,
  autoFocus,
  busy,
  label,
  describedById,
  invalid,
}: PinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const active = Math.min(value.length, length - 1);

  useEffect(() => {
    if (autoFocus) refs.current[active]?.focus();
    // Re-focus follows the prefix as it grows/shrinks.
  }, [autoFocus, active]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (busy) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (busy) return;
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    if (digit) onChange((value + digit).slice(0, length));
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    if (busy) return;
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (digits) onChange(digits);
  }

  return (
    // Not `disabled` while busy: disabling the focused box makes the browser
    // blur it and drop the on-screen keypad, and the post-error refocus isn't
    // a user gesture, so mobile never brings the keypad back. aria-busy plus
    // per-handler guards keep the caret and the keypad where they are.
    <fieldset aria-busy={busy} className={busy ? "opacity-60" : undefined}>
      <legend className="block text-sm font-medium">{label}</legend>
      <div className="mt-2 flex gap-3" onPaste={handlePaste}>
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="password"
            inputMode="numeric"
            // Not "one-time-code": that offers iOS SMS autofill, wrong for a
            // PIN typed dozens of times a shift.
            autoComplete="off"
            aria-label={`${label} digit ${i + 1}`}
            aria-describedby={describedById}
            aria-invalid={invalid || undefined}
            // Roving tabindex: without it the onFocus redirect below bounces
            // every Tab back to the active box and traps keyboard users.
            tabIndex={i === active ? 0 : -1}
            value={value[i] ?? ""}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              // Typing goes into the first empty box, wherever the tap landed.
              // (tabindex=-1 boxes are still click-focusable, so this stays.)
              if (i !== active) refs.current[active]?.focus();
            }}
            className="h-14 w-12 border border-line bg-white text-center font-mono text-2xl focus:border-madder"
          />
        ))}
      </div>
    </fieldset>
  );
}
