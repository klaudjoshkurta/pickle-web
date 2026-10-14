import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "tonal" | "text";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary shadow-soft hover:bg-primary-hover",
  tonal: "bg-surface-variant text-ink hover:bg-surface-variant-hover",
  text: "px-3 text-primary hover:bg-primary/10",
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
