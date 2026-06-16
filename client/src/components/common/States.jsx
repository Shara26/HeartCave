export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="hc-card flex flex-col items-center gap-3 px-6 py-12 text-center animate-fade-up">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lavender-50 text-lavender-400">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-lavender-700">{title}</h3>
      {description && <p className="max-w-sm text-sm text-lavender-500">{description}</p>}
      {action}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="hc-card animate-pulse-soft p-5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-lavender-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-lavender-100" />
          <div className="h-3 w-1/4 rounded bg-lavender-50" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-lavender-100" />
        <div className="h-3 w-5/6 rounded bg-lavender-50" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default EmptyState;
