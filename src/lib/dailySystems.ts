/* Jake's daily systems, computed from Pacific wall-clock:
   COFFEE — 0→50% 06:30–08:00, 50→100% 14:00–14:30
   LOU'S MEDS — dose 01 at 06:00 (50%), dose 02 at 18:30 (100%) */

export type Gauge = { id: string; label: string; pct: number; status: string }

export function pacificMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const h = +(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24
  const m = +(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return h * 60 + m
}

export function pacificClock(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)
}

const ramp = (t: number, a: number, b: number, from: number, to: number) =>
  t <= a ? from : t >= b ? to : from + ((t - a) / (b - a)) * (to - from)

const until = (t: number, target: number) => {
  const d = target - t
  const h = Math.floor(d / 60)
  const m = Math.round(d % 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

export function dailyGauges(t: number): Gauge[] {
  let coffeePct: number
  let coffeeStatus: string
  if (t < 390) {
    coffeePct = 0
    coffeeStatus = `first pour in ${until(t, 390)}`
  } else if (t < 480) {
    coffeePct = ramp(t, 390, 480, 0, 50)
    coffeeStatus = 'morning pour'
  } else if (t < 840) {
    coffeePct = 50
    coffeeStatus = `2nd wave in ${until(t, 840)}`
  } else if (t < 870) {
    coffeePct = ramp(t, 840, 870, 50, 100)
    coffeeStatus = 'afternoon dose'
  } else {
    coffeePct = 100
    coffeeStatus = 'fully caffeinated'
  }

  let pillPct: number
  let pillStatus: string
  if (t < 360) {
    pillPct = 0
    pillStatus = `dose 01 in ${until(t, 360)}`
  } else if (t < 1110) {
    pillPct = 50
    pillStatus = `dose 02 in ${until(t, 1110)}`
  } else {
    pillPct = 100
    pillStatus = 'all doses given · good boy'
  }

  return [
    { id: 'coffee', label: 'COFFEE', pct: coffeePct, status: coffeeStatus },
    { id: 'pills', label: "LOU'S MEDS", pct: pillPct, status: pillStatus },
  ]
}
