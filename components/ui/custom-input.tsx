import React from 'react';

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    {label}
                </label>
                <input
                    ref={ref}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00b4d8] bg-gray-800 transition-colors text-white placeholder-gray-500
            ${error ? 'border-red-500' : 'border-gray-700 hover:border-gray-500'}
            ${className}
          `}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

CustomInput.displayName = "CustomInput";
