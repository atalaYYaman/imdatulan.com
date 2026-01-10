import React from 'react';

interface CustomCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: React.ReactNode;
    error?: string;
}

export const CustomCheckbox = React.forwardRef<HTMLInputElement, CustomCheckboxProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="mb-4">
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            ref={ref}
                            type="checkbox"
                            className={`w-4 h-4 text-primary border-muted-foreground rounded focus:ring-primary bg-input dark:bg-gray-700 dark:border-gray-600
                ${error ? 'border-destructive' : ''}
                ${className}
              `}
                            {...props}
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label className="text-muted-foreground dark:text-gray-300 select-none cursor-pointer">
                            {label}
                        </label>
                    </div>
                </div>
                {error && <p className="mt-1 text-xs text-destructive ml-7">{error}</p>}
            </div>
        );
    }
);

CustomCheckbox.displayName = "CustomCheckbox";
