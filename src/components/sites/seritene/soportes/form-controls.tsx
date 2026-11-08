/**
 * Controles de formulario con el marcado y las clases (shadcn/ui ya resueltas) que usa producción.
 * Las utilidades Tailwind están compiladas en base.css.
 */
import type { InputHTMLAttributes, SelectHTMLAttributes, OptionHTMLAttributes } from "react";
import { Check, ChevronDown } from "lucide-react";

const INPUT_CLASS =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input data-slot="input" className={INPUT_CLASS} {...props} />;
}

const SELECT_CLASS =
  "h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-transparent px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed data-[size=sm]:h-8 data-[size=sm]:py-1 dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";

export function NativeSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="group/native-select relative w-fit has-[select:disabled]:opacity-50" data-slot="native-select-wrapper">
      <select data-slot="native-select" data-size="default" className={SELECT_CLASS} {...props} />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground opacity-50 select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

export function NativeSelectOption(props: OptionHTMLAttributes<HTMLOptionElement>) {
  return <option data-slot="native-select-option" className="bg-[Canvas] text-[CanvasText]" {...props} />;
}

const CHECKBOX_CLASS =
  "peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label"?: string;
};

/** Casilla con el marcado de Radix Checkbox (botón role=checkbox). */
export function Checkbox({ checked, onCheckedChange, ...rest }: CheckboxProps) {
  const state = checked ? "checked" : "unchecked";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-state={state}
      value="on"
      data-slot="checkbox"
      className={CHECKBOX_CLASS}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
      onClick={() => onCheckedChange(!checked)}
      {...rest}
    >
      {checked && (
        <span
          data-state={state}
          data-slot="checkbox-indicator"
          className="grid place-content-center text-current transition-none"
          style={{ pointerEvents: "none" }}
        >
          <Check className="size-3.5" />
        </span>
      )}
    </button>
  );
}
