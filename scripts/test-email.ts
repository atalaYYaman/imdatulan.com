import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    console.error("Error: RESEND_API_KEY is not set.");
    process.exit(1);
}

const resend = new Resend(apiKey);

async function sendTestEmail() {
    try {
        const data = await resend.emails.send({
            from: 'Otlak <info@otlak.com.tr>',
            to: 'info@otlak.com.tr', // Sending to self for test
            subject: 'Test Email from Otlak',
            html: '<p>This is a test email to verify Resend configuration.</p>'
        });

        if (data.error) {
            console.error("Resend API Error:", data.error);
        } else {
            console.log("Email sent successfully!", data);
        }
    } catch (error) {
        console.error("Unexpected Error:", error);
    }
}

sendTestEmail();
