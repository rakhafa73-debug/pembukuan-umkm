import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600",
  secondary: "bg-ink-900 text-white hover:bg-ink-800 focus-visible:outline-ink-900",
  ghost: "bg-transparent text-ink-600 hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-ink-400",
  outline: "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50 focus-visible:outline-ink-400",
  danger: "bg-danger-500 text-white hover:bg-danger-700 focus-visible:outline-danger-500",
  success: "bg-success-500 text-white hover:bg-success-700 focus-visible:outline-success-500",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}
