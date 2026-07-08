import clsx from "clsx";
import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={clsx("mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300", className)} {...props} />;
}

interface FieldWrapProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldWrap({ label, error, required, children }: FieldWrapProps) {
  return (
    <div>
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const baseInputClasses =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-900/40 disabled:opacity-60 disabled:cursor-not-allowed";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, required, className, ...props }, ref) => {
  return (
    <FieldWrap label={label} error={error} required={required}>
      <input ref={ref} className={clsx(baseInputClasses, error && "border-red-400", className)} {...props} />
    </FieldWrap>
  );
});
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, required, className, ...props }, ref) => {
  return (
    <FieldWrap label={label} error={error} required={required}>
      <textarea ref={ref} className={clsx(baseInputClasses, error && "border-red-400", className)} {...props} />
    </FieldWrap>
  );
});
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, required, className, children, ...props }, ref) => {
  return (
    <FieldWrap label={label} error={error} required={required}>
      <select ref={ref} className={clsx(baseInputClasses, "cursor-pointer", error && "border-red-400", className)} {...props}>
        {children}
      </select>
    </FieldWrap>
  );
});
Select.displayName = "Select";
