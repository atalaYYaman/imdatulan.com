
import React from 'react';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Destek Talebi
                </h2>
                <p className="mt-4 text-center text-gray-600">
                    Şu an için destek formumuz hazırlanmaktadır. Lütfen daha sonra tekrar deneyiniz.
                </p>
                <div className="mt-6 text-center">
                    <a href="/" className="font-medium text-teal-600 hover:text-teal-500">
                        Ana Sayfaya Dön
                    </a>
                </div>
            </div>
        </div>
    );
}
