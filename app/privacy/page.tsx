import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-8 text-foreground">
            <h1 className="text-3xl font-bold mb-6">Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>

            <div className="prose dark:prose-invert max-w-none space-y-4 text-muted-foreground">
                <p>
                    Otlak ("Şirket") olarak, kullanıcılarımızın kişisel verilerinin korunmasına büyük önem vermekteyiz.
                    Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla aydınlatma yükümlülüğümüzü yerine getirmek amacıyla hazırlanmıştır.
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-6">1. İşlenen Kişisel Veriler</h2>
                <p>
                    Platformumuza üye olurken adınız, soyadınız, üniversite/bölüm bilgileriniz, öğrenci numaranız ve iletişim bilgileriniz (e-posta adresi) işlenmektedir.
                    Ayrıca öğrenci olduğunuzu doğrulamak amacıyla yüklediğiniz kimlik kartı görseli, doğrulama işlemi tamamlandıktan sonra güvenli bir şekilde saklanmakta veya politikamıza göre imha edilmektedir.
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-6">2. Kişisel Verilerin İşlenme Amacı</h2>
                <ul className="list-disc list-inside space-y-1">
                    <li>Üyelik işlemlerinin gerçekleştirilmesi,</li>
                    <li>Not paylaşım platformunun güvenliğinin sağlanması,</li>
                    <li>Sadece doğrulanmış üniversite öğrencilerinin erişimine izin verilmesi (Kapalı Devre Sistem),</li>
                    <li>Hizmet kalitesinin artırılması ve kullanıcı deneyiminin iyileştirilmesi.</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-6">3. Verilerin Aktarılması</h2>
                <p>
                    Kişisel verileriniz, yasal zorunluluklar haricinde üçüncü kişilerle paylaşılmamaktadır.
                    Öğrenci kimlik kartınız sadece yetkili yöneticiler tarafından doğrulama amacıyla görüntülenir.
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-6">4. Haklarınız</h2>
                <p>
                    KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme,
                    işlenme amacını öğrenme ve amacına uygun kullanılıp kullanılmadığını öğrenme haklarına sahipsiniz.
                </p>

                <p className="mt-8 text-sm italic">
                    Son Güncelleme: 10 Ocak 2026
                </p>
            </div>
        </div>
    );
}
