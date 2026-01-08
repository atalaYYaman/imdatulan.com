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
            from: 'Otlak <onboarding@resend.dev>', // Default testing domain for Resend
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
