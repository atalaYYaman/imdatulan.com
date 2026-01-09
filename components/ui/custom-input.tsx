import React from 'react';

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="w-full mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {label}
                </label>
                <input
                    ref={ref}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary bg-input transition-colors text-foreground placeholder-muted-foreground
            ${error ? 'border-destructive' : 'border-border hover:border-muted-foreground'}
            ${className}
          `}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>
        );
    }
);

CustomInput.displayName = "CustomInput";
