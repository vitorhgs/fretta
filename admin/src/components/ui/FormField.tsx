import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

interface BaseProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & {
  as?: "input";
};

type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & {
  as: "textarea";
};

type SelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement> & {
  as: "select";
  children: ReactNode;
};

type FormFieldProps = InputProps | TextareaProps | SelectProps;

export function FormField(props: FormFieldProps) {
  const { label, required, error, hint, as = "input", className = "", ...rest } = props as any;

  const inputClasses = `
    mt-1 border px-3 py-2.5 rounded-lg w-full text-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    transition disabled:bg-slate-50 disabled:cursor-not-allowed
    ${error ? "border-red-400" : "border-slate-300"}
    ${className}
  `;

  return (
    <div>
      <label className="text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {as === "textarea" ? (
        <textarea className={`${inputClasses} resize-none`} {...rest} />
      ) : as === "select" ? (
        <select className={`${inputClasses} bg-white cursor-pointer`} {...rest}>
          {(rest as SelectProps).children}
        </select>
      ) : (
        <input className={inputClasses} {...rest} />
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}