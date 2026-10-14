import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "dark" | "outline" | "text";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream " +
  "active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0";

const variants: Record<Variant, string> = {
  primary: "border-2 border-ink bg-primary text-on-primary hover:bg-primary-hover",
  dark: "border-2 border-ink bg-ink text-cream hover:bg-ink/90",
  outline: "border-2 border-ink bg-paper text-ink hover:bg-surface-variant",
  text: "px-3 text-ink-muted hover:text-ink hover:bg-ink/5",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
