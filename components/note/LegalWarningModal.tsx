'use client';

import { ShieldAlert } from 'lucide-react';

interface LegalWarningModalProps {
    onAccept: () => void;
}

export default function LegalWarningModal({ onAccept }: LegalWarningModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#002A30] border border-[#003E44] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-yellow-500/10 rounded-full mb-4">
                        <ShieldAlert className="w-10 h-10 text-yellow-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Yasal Uyarı</h2>
                    <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                        Bu notlar sadece eğitim ve kişisel kullanım amaçlıdır.
                        İçeriğin kopyalanması, çoğaltılması veya ticari amaçla kullanılması yasaktır.
                        Dışarı sızdırılması durumunda kullanıcı IP adresiniz ve hesap bilgileriniz üzerinden yasal işlem başlatılabilir.
                    </p>

                    <button
                        onClick={onAccept}
                        className="w-full py-3 bg-[#22d3ee] hover:bg-[#0ea5e9] text-[#002A30] font-bold rounded-xl transition-all active:scale-95"
                    >
                        Okudum, Kabul Ediyorum
                    </button>

                    <p className="text-xs text-gray-500 mt-4">
                        Devam ederek Otlak.com.tr kullanım koşullarını kabul etmiş sayılırsınız.
                    </p>
                </div>
            </div>
        </div>
    );
}
