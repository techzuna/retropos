"use client";

import { useCallback, useState } from "react";

/**
 * Small modal prompts and confirmations, replacing `window.prompt` /
 * `window.confirm`.
 *
 * Those had to go: the browser refuses `prompt()` outright here ("prompt() is
 * not supported"), which turned every inline edit — rename a table, retime a
 * service period, change a price — into a runtime error. They were also poor on
 * a tablet, where a native dialog is unstyled and easy to mis-tap.
 *
 * The API stays deliberately promise-shaped so a call site reads almost as it
 * did before:
 *
 *   const v = await ask({ title: "Rename table", fields: [...] });
 *   if (!v) return;                       // cancelled
 *   if (!(await confirm({ ... }))) return;
 *
 * Render `{dialog}` once anywhere in the component; only one is ever open, and
 * its backdrop swallows clicks so nothing else can be touched meanwhile.
 */

export interface DialogField {
  name: string;
  label: string;
  value?: string;
  type?: "text" | "number" | "time" | "tel" | "email" | "password";
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  /** Offer suggestions without restricting input, as a datalist. */
  options?: string[];
}

interface AskSpec {
  title: string;
  message?: string;
  fields: DialogField[];
  submitLabel?: string;
}

interface ConfirmSpec {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** Style the confirm button as destructive. */
  danger?: boolean;
}

type Pending =
  | { kind: "ask"; spec: AskSpec; resolve: (v: Record<string, string> | null) => void }
  | { kind: "confirm"; spec: ConfirmSpec; resolve: (v: boolean) => void };

export function useDialog() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const ask = useCallback(
    (spec: AskSpec) =>
      new Promise<Record<string, string> | null>((resolve) => {
        setValues(Object.fromEntries(spec.fields.map((f) => [f.name, f.value ?? ""])));
        setPending({ kind: "ask", spec, resolve });
      }),
    [],
  );

  const confirm = useCallback(
    (spec: ConfirmSpec) =>
      new Promise<boolean>((resolve) => {
        setPending({ kind: "confirm", spec, resolve });
      }),
    [],
  );

  function cancel() {
    if (!pending) return;
    // Resolve with the "nothing happened" value for whichever kind is open, so
    // an awaiting caller never hangs on a dismissed dialog.
    if (pending.kind === "ask") pending.resolve(null);
    else pending.resolve(false);
    setPending(null);
  }

  function submit() {
    if (!pending) return;
    if (pending.kind === "ask") pending.resolve({ ...values });
    else pending.resolve(true);
    setPending(null);
  }

  const dialog = pending ? (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={pending.spec.title}
        className="w-full max-w-xs border border-line bg-white"
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
        }}
      >
        <div className="dhaka-band dhaka-band-brass" aria-hidden="true" />
        <form
          className="p-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <h2 className="font-display text-lg leading-tight">{pending.spec.title}</h2>
          {pending.spec.message && (
            <p className="mt-1 text-sm text-ink-soft">{pending.spec.message}</p>
          )}

          {pending.kind === "ask" && (
            <div className="mt-3 space-y-3">
              {pending.spec.fields.map((f, i) => (
                <label key={f.name} className="block">
                  <span className="block text-sm font-medium">{f.label}</span>
                  <input
                    // A modal opened by a deliberate tap should take the caret
                    // at once — it is what the native prompt did.
                    autoFocus={i === 0}
                    type={f.type ?? "text"}
                    inputMode={f.type === "number" ? "numeric" : undefined}
                    placeholder={f.placeholder}
                    min={f.min}
                    max={f.max}
                    maxLength={f.maxLength}
                    list={f.options ? `${f.name}-options` : undefined}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className="mt-1 w-full border border-line bg-white px-3 py-2.5"
                  />
                  {f.options && (
                    <datalist id={`${f.name}-options`}>
                      {f.options.map((o) => (
                        <option key={o} value={o} />
                      ))}
                    </datalist>
                  )}
                  {f.hint && <span className="mt-1 block text-xs text-ink-soft">{f.hint}</span>}
                </label>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={cancel} className="btn flex-1 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              className={`btn flex-1 text-sm ${
                pending.kind === "confirm" && pending.spec.danger
                  ? "btn-primary"
                  : "btn-secondary"
              }`}
            >
              {pending.kind === "ask"
                ? (pending.spec.submitLabel ?? "Save")
                : (pending.spec.confirmLabel ?? "Confirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return { ask, confirm, dialog };
}
