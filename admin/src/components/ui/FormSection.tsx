import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface FormSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export function FormSection({ title, icon: Icon, children }: FormSectionProps) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />}
        {title}
      </h3>
      {children}
    </div>
  );
}