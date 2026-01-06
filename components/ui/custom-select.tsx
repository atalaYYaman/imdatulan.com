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
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    {label}
                </label>
                <select
                    ref={ref}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00b4d8] bg-gray-800 transition-colors text-white placeholder-gray-400
            ${error ? 'border-red-500' : 'border-gray-700 hover:border-gray-500'}
            ${className}
          `}
                    {...props}
                >
                    <option value="" disabled className="text-gray-500">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} disabled={opt.disabled} className={opt.disabled ? 'text-gray-500 bg-gray-900' : 'text-white'}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

CustomSelect.displayName = "CustomSelect";
