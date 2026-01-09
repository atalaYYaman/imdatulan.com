import React from 'react';

export interface Option {
    label: string;
    value: string;
    disabled?: boolean;
}

interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: Option[];
    error?: string;
    placeholder?: string;
}

export const CustomSelect = React.forwardRef<HTMLSelectElement, CustomSelectProps>(
    ({ label, options, error, placeholder = "Seçiniz...", className, ...props }, ref) => {
        return (
            <div className="w-full mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {label}
                </label>
                <select
                    ref={ref}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary bg-input transition-colors text-foreground placeholder-muted-foreground
            ${error ? 'border-destructive' : 'border-border hover:border-muted-foreground'}
            ${className}
          `}
                    {...props}
                >
                    <option value="" disabled className="text-muted-foreground">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} disabled={opt.disabled} className={opt.disabled ? 'text-muted-foreground bg-muted' : 'text-foreground'}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>
        );
    }
);

CustomSelect.displayName = "CustomSelect";
