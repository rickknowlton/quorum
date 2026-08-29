import { cn } from "@/lib/cn";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "mt-1.5 min-h-11 w-full min-w-0 max-w-full rounded-lg border border-border bg-white px-3 text-base text-foreground shadow-sm outline-none placeholder:text-stone-400",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "mt-1.5 min-h-28 w-full rounded-lg border border-border bg-white px-3 py-2 text-base text-foreground shadow-sm outline-none placeholder:text-stone-400",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) {
    return null;
  }

  return (
    <p id={id} className="mt-1.5 text-sm text-red-700" role="alert">
      {children}
    </p>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm text-muted">{children}</p>;
}
