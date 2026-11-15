function Bar({ className = "" }: Readonly<{ className?: string }>) {
  return <div aria-hidden className={`rounded-lg bg-[#e8ecf7] ${className}`} />;
}

function Wrap({ children, className = "" }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div role="status" aria-label="Loading" className={`motion-safe:animate-pulse ${className}`}>
      {children}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: Readonly<{ rows?: number }>) {
  return (
    <Wrap className="divide-y divide-black/[0.05]">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-4">
          <Bar className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bar className="h-3.5 w-1/3" />
            <Bar className="h-3 w-3/4" />
          </div>
          <Bar className="h-3 w-10" />
        </div>
      ))}
    </Wrap>
  );
}

export function PostListSkeleton({ cards = 3 }: Readonly<{ cards?: number }>) {
  return (
    <Wrap className="space-y-4">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Bar className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bar className="h-3.5 w-1/3" />
              <Bar className="h-3 w-1/5" />
            </div>
            <Bar className="h-6 w-24 rounded-full" />
          </div>
          <div className="mt-4 space-y-2">
            <Bar className="h-3.5 w-full" />
            <Bar className="h-3.5 w-5/6" />
          </div>
          <Bar className="mt-4 h-10 w-36 rounded-full" />
        </div>
      ))}
    </Wrap>
  );
}

export function ComfortDetailSkeleton() {
  return (
    <Wrap className="space-y-5">
      <Bar className="h-4 w-24" />
      <div className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
          <div className="flex-1 space-y-2">
            <Bar className="h-3 w-28" />
            <Bar className="h-4 w-40" />
          </div>
          <Bar className="h-6 w-16 rounded-full" />
        </div>
        <div className="space-y-3 px-5 py-6">
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-11/12" />
          <Bar className="h-4 w-2/3" />
        </div>
      </div>
    </Wrap>
  );
}
export function SendComfortSkeleton() {
  return (
    <Wrap className="space-y-6">
      <Bar className="h-4 w-16" />
      <div className="space-y-2">
        <Bar className="h-8 w-48" />
        <Bar className="h-4 w-72 max-w-full" />
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
        <Bar className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bar className="h-3.5 w-1/3" />
          <Bar className="h-3 w-4/5" />
        </div>
      </div>
      <Bar className="h-11 w-full rounded-full" />
      <Bar className="h-40 w-full rounded-2xl" />
      <Bar className="h-12 w-full rounded-full" />
    </Wrap>
  );
}