import * as React from "react";
import { Info } from "lucide-react";

export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`card-sheen min-w-0 rounded-xl border border-border bg-card text-card-foreground transition-all shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`min-w-0 flex flex-col space-y-1 p-4 pb-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`min-w-0 break-words text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`min-w-0 p-4 pt-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatHeader({
  title,
  hint,
  icon: Icon,
}: {
  title: string;
  hint: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
      <CardTitle>{title}</CardTitle>
      <div className="relative group cursor-help">
        {Icon ? (
          <Icon className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
        ) : (
          <Info className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
        )}
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-56 p-2 bg-popover border border-border rounded-lg text-xs text-popover-foreground shadow-xl pointer-events-none">
          <div className="font-semibold mb-0.5">{title}</div>
          <div className="text-muted-foreground">{hint}</div>
        </div>
      </div>
    </CardHeader>
  );
}
