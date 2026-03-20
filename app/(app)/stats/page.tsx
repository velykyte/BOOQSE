import { requireInstantUser } from "@/lib/server/session-user";
import { getStatsPageView } from "@/lib/server/stats";
import { redirect } from "next/navigation";
import Image from "next/image";
import asset3 from "@/ASSETS/Asset 3.webp";

function LineChart({
  title,
  unit,
  points,
  stroke,
  valueDecimals,
}: {
  title: string;
  unit: string;
  points: Array<{ label: string; value: number }>;
  stroke: string;
  valueDecimals?: number;
}) {
  const w = 520;
  const h = 190;
  const padX = 28;
  const padY = 22;

  const n = points.length;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;

  const xAt = (i: number) => {
    if (n <= 1) return padX;
    const t = i / (n - 1);
    return padX + t * (w - padX * 2);
  };

  const yAt = (v: number) => {
    const t = span === 0 ? 0.5 : (v - min) / span;
    return h - padY - t * (h - padY * 2);
  };

  const d =
    n === 0
      ? ""
      : points
          .map((p, i) => {
            const x = xAt(i);
            const y = yAt(p.value);
            return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(" ");

  const last = n > 0 ? points[n - 1] : null;

  const formatValue = (v: number) => {
    if (typeof valueDecimals === "number") return `${v.toFixed(valueDecimals)}`;
    return `${Math.round(v)}`;
  };

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{title}</p>
          <p className="mt-1 font-serif text-2xl leading-tight">
            {last ? `${formatValue(last.value)}${unit}` : "—"}
          </p>
        </div>
        {n > 0 ? (
          <div className="text-right">
            <p className="text-xs text-[var(--text-secondary)]">{points[0]?.label}</p>
            <p className="text-xs text-[var(--text-secondary)]">{points[n - 1]?.label}</p>
          </div>
        ) : null}
      </div>

      {n === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">No data yet.</p>
      ) : (
        <svg
          className="mt-4 w-full"
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={`${title} line chart`}
        >
          {/* Background grid */}
          {[0, 1, 2, 3].map((i) => {
            const y = padY + i * ((h - padY * 2) / 3);
            return (
              <line
                key={i}
                x1={padX}
                y1={y}
                x2={w - padX}
                y2={y}
                stroke="var(--border-subtle)"
                strokeOpacity={0.4}
              />
            );
          })}

          {/* Line */}
          <path d={d} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {points.map((p, i) => {
            const x = xAt(i);
            const y = yAt(p.value);
            return (
              <g key={p.label + i}>
                <circle cx={x} cy={y} r={5} fill="var(--surface)" stroke={stroke} strokeWidth={3} />
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
}

function PieChart({
  title,
  unit,
  points,
  valueDecimals,
}: {
  title: string;
  unit: string;
  points: Array<{ label: string; value: number }>;
  valueDecimals?: number;
}) {
  const w = 200;
  const h = 200;
  const cx = w / 2;
  const cy = h / 2;
  const r = 85;

  const safePoints = points.filter((p) => Number.isFinite(p.value) && p.value > 0);
  const total = safePoints.reduce((acc, p) => acc + p.value, 0);

  const formatValue = (v: number) => {
    if (typeof valueDecimals === "number") return `${v.toFixed(valueDecimals)}${unit}`;
    return `${Math.round(v)}${unit}`;
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeSlicePath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return [
      `M ${cx} ${cy}`,
      `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
      `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
      "Z",
    ].join(" ");
  };

  const palette = [
    "var(--brand-blue)",
    "var(--brand-blue-hover)",
    "var(--brand-burgundy)",
    "var(--brand-burgundy-hover)",
    "var(--brand-blue-soft)",
    "var(--brand-burgundy-soft)",
  ];

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{title}</p>
          <p className="mt-1 font-serif text-2xl leading-tight">
            {total > 0 ? formatValue(total) : "—"}
          </p>
        </div>
        {safePoints.length > 0 ? (
          <div className="text-right">
            <p className="text-xs text-[var(--text-secondary)]">Total</p>
          </div>
        ) : null}
      </div>

      {safePoints.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">No data yet.</p>
      ) : (
        <>
          <svg
            className="mt-4 w-full"
            viewBox={`0 0 ${w} ${h}`}
            role="img"
            aria-label={`${title} pie chart`}
          >
            {safePoints.map((p, idx) => {
              const fraction = total === 0 ? 0 : p.value / total;
              // Start at top (-90deg) for a consistent “12 o'clock” start.
              const startAngle = -90 + safePoints.slice(0, idx).reduce((acc, x) => acc + (x.value / total) * 360, 0);
              const endAngle = startAngle + fraction * 360;
              const fill = palette[idx % palette.length];
              return (
                <path
                  key={p.label + idx}
                  d={describeSlicePath(startAngle, endAngle)}
                  fill={fill}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              );
            })}
          </svg>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {safePoints.slice(0, 4).map((p, idx) => {
              const color = palette[idx % palette.length];
              return (
                <div key={p.label} className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
                  <p className="text-xs text-[var(--text-secondary)]">
                    {p.label}: {formatValue(p.value)}
                  </p>
                </div>
              );
            })}
            {safePoints.length > 4 ? (
              <p className="text-xs text-[var(--text-secondary)]">
                +{safePoints.length - 4} more
              </p>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}

export default async function StatsPage() {
  const auth = await requireInstantUser();
  if (!auth) {
    // Keep UX consistent with other protected pages.
    redirect("/auth");
  }

  const view = await getStatsPageView(auth.user.id);

  return (
    <main className="flex flex-col gap-8">
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 md:p-12">
        <p className="text-sm text-[var(--text-secondary)]">Stats</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 md:max-w-[50%]">
            <h1 className="font-serif text-4xl leading-tight tracking-tight md:text-5xl">
              Your reading stats
            </h1>
            <p className="mt-4 break-words text-base text-[var(--text-secondary)]">
              Pages per day, time per day, and reading speed — powered by your logged sessions.
            </p>
          </div>
          <div className="flex justify-end md:flex-shrink-0">
            <Image
              src={asset3}
              alt=""
              className="h-56 w-auto object-contain md:h-72"
              priority
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl leading-tight">Streak</h2>
          <p className="text-sm text-[var(--text-secondary)]">{view.streakDays} day(s)</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LineChart
          title="Pages per day"
          unit=""
          points={view.pagesPerDay.map((p) => ({ label: p.label, value: p.value }))}
          stroke="var(--brand-burgundy)"
        />
        <PieChart
          title="Time per day"
          unit="m"
          points={view.timePerDay.map((p) => ({ label: p.label, value: p.value }))}
        />
        <LineChart
          title="Avg speed"
          unit="/h"
          points={view.avgSpeedPerDay.map((p) => ({ label: p.label, value: p.value }))}
          valueDecimals={1}
          stroke="var(--brand-blue)"
        />
      </div>
    </main>
  );
}
