import { Resend } from 'resend';

// Initialize at module level, but safely
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

type EmailPayload = {
    to: string;
    subject: string;
    body: string;
};

export const sendEmail = async (data: EmailPayload) => {
    // If no API key (e.g. during build or local dev without .env), log and return success
    if (!resend) {
        console.log("Mock Email Sent (No API Key configured):", data);
        return { success: true };
    }

    try {
        await resend.emails.send({
            from: 'Otlak <noreply@otlak.com.tr>', // Updated to real domain
            to: data.to,
            subject: data.subject,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Otlak Bildirim</h2>
                    <p style="white-space: pre-wrap;">${data.body}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">Bu mesaj otomatik olarak gönderilmiştir.</p>
                </div>
            `
        });
        return { success: true };
    } catch (error) {
        console.error("Error sending email via Resend:", error);
        return { success: false, error };
    }
};

export const sendNoteApprovedEmail = async (to: string, noteTitle: string) => {
    return sendEmail({
        to,
        subject: 'Notunuz Onaylandı! 🎉',
        body: `Harika haber! "${noteTitle}" başlıklı notunuz moderatörlerimiz tarafından onaylandı ve yayına alındı.
        
Hesabınıza 3 Süt (kredi) yüklendi. Artık diğer öğrencilerin paylaşımlarını inceleyebilirsiniz.

Teşekkürler,
Otlak Ekibi`
    });
};

export const sendNoteRejectedEmail = async (to: string, noteTitle: string, reason: string) => {
    return sendEmail({
        to,
        subject: 'Notunuz Hakkında Bilgilendirme',
        body: `Üzgünüz, "${noteTitle}" başlıklı notunuz aşağıdaki sebep(ler)den dolayı onaylanamadı:
        
"${reason}"

Lütfen kurallarımızı gözden geçirip tekrar yüklemeyi deneyin.

Otlak Ekibi`
    });
};
