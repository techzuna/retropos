"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SlotOption {
  startsAt: string;
  label: string;
}

interface BookingFormProps {
  phone: string;
  maxPartySize: number;
  minDate: string;
  maxDate: string;
}

export function BookingForm({ phone, maxPartySize, minDate, maxDate }: BookingFormProps) {
  const router = useRouter();

  const [date, setDate] = useState(minDate);
  const [partySize, setPartySize] = useState(2);
  // Slots are keyed by their query so stale results never show: a key
  // mismatch simply reads as "loading", no imperative resets needed.
  const [loaded, setLoaded] = useState<{ key: string; slots: SlotOption[] } | null>(null);
  const [picked, setPicked] = useState<SlotOption | null>(null);

  const slotsKey = `${date}|${partySize}`;
  const slots = loaded?.key === slotsKey ? loaded.slots : null;
  const loadingSlots = slots === null;
  const selected = (picked && slots?.find((s) => s.startsAt === picked.startsAt)) || null;

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const key = `${date}|${partySize}`;
    fetch(`/api/availability?date=${date}&partySize=${partySize}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { slots?: SlotOption[] }) => setLoaded({ key, slots: data.slots ?? [] }))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoaded({ key, slots: [] });
      });
    return () => controller.abort();
  }, [date, partySize]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: selected.startsAt,
        partySize,
        guestName,
        guestEmail,
        guestPhone,
        notes,
      }),
    }).catch(() => null);

    const data = res ? await res.json().catch(() => null) : null;

    if (res?.status === 201 && data?.token) {
      router.push(`/reservation/${data.token}?new=1`);
      return;
    }

    setSubmitting(false);
    if (res?.status === 409) {
      setError(data?.error ?? "That time was just taken — please pick another.");
      setPicked(null);
      const refresh = await fetch(`/api/availability?date=${date}&partySize=${partySize}`)
        .then((r) => r.json())
        .catch(() => null);
      if (refresh?.slots) setLoaded({ key: `${date}|${partySize}`, slots: refresh.slots });
      return;
    }
    setError(
      data?.issues?.[0]?.message ??
        data?.error ??
        "Something went wrong — please try again, or call us.",
    );
  }

  const lunch = slots?.filter((s) => Number(s.label.slice(0, 2)) < 16) ?? [];
  const dinner = slots?.filter((s) => Number(s.label.slice(0, 2)) >= 16) ?? [];

  return (
    <form onSubmit={submit} className="mt-8 space-y-8 pb-4">
      <fieldset>
        <legend className="eyebrow">1 · Day &amp; party</legend>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="flex-1 min-w-40">
            <span className="block text-sm font-medium">Date</span>
            <input
              type="date"
              required
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full border border-line bg-white px-3 py-2"
            />
          </label>
          <label>
            <span className="block text-sm font-medium">Guests</span>
            <select
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className="mt-1 border border-line bg-white px-3 py-2"
            >
              {Array.from({ length: maxPartySize }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {/* Single expression: this Next/SWC version eats the space in `{expr} text` */}
          {`More than ${maxPartySize}? Call ${phone} and we'll sort it out.`}
        </p>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">2 · Time</legend>
        {loadingSlots ? (
          <p className="mt-3 text-sm text-ink-soft">Checking the book…</p>
        ) : slots && slots.length > 0 ? (
          <div className="mt-3 space-y-4">
            {[
              { title: "Lunch", options: lunch },
              { title: "Dinner", options: dinner },
            ]
              .filter((g) => g.options.length > 0)
              .map((group) => (
                <div key={group.title}>
                  <p className="text-sm font-medium">{group.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.options.map((slot) => {
                      const isSelected = selected?.startsAt === slot.startsAt;
                      return (
                        <button
                          key={slot.startsAt}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setPicked(slot)}
                          className={`border px-3 py-2 font-mono text-sm transition-colors ${
                            isSelected
                              ? "border-madder bg-madder text-paper"
                              : "border-line bg-white hover:border-brass"
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            No online tables left for this day — try another date, or call {phone}.
          </p>
        )}
      </fieldset>

      {selected && (
        <fieldset>
          <legend className="eyebrow">3 · Your details</legend>
          <div className="mt-3 space-y-4">
            <label className="block">
              <span className="block text-sm font-medium">Name</span>
              <input
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1 w-full border border-line bg-white px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex-1 min-w-52">
                <span className="block text-sm font-medium">Email</span>
                <input
                  type="email"
                  required
                  maxLength={200}
                  autoComplete="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="mt-1 w-full border border-line bg-white px-3 py-2"
                />
              </label>
              <label className="flex-1 min-w-40">
                <span className="block text-sm font-medium">Phone</span>
                <input
                  type="tel"
                  required
                  maxLength={20}
                  autoComplete="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="mt-1 w-full border border-line bg-white px-3 py-2"
                />
              </label>
            </div>
            <label className="block">
              <span className="block text-sm font-medium">
                Notes <span className="font-normal text-ink-soft">— allergies, occasions, a good spot</span>
              </span>
              <textarea
                maxLength={500}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full border border-line bg-white px-3 py-2"
              />
            </label>
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="border border-madder/40 bg-madder/5 px-4 py-3 text-sm text-madder-deep">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!selected || submitting}
        className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {submitting
          ? "Booking…"
          : selected
            ? `Confirm ${selected.label} for ${partySize}`
            : "Choose a time to continue"}
      </button>
    </form>
  );
}
