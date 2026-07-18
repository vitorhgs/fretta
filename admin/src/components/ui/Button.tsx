import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "success" | "warning" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 border border-transparent",
  secondary:
    "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
  danger:
    "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100",
  success:
    "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100",
  warning:
    "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100",
  ghost:
    "text-slate-600 hover:bg-slate-100 border border-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

const ICON_SIZES: Record<Size, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-4 h-4",
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading,
  fullWidth,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  const iconSize = ICON_SIZES[size];

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-xl font-semibold
        transition active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANTS[variant]} ${SIZES[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <div className={`${iconSize} border-2 border-current border-t-transparent rounded-full animate-spin`} />
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className={iconSize} strokeWidth={2.2} />}
          {children}
          {Icon && iconPosition === "right" && <Icon className={iconSize} strokeWidth={2.2} />}
        </>
      )}
    </button>
  );
}