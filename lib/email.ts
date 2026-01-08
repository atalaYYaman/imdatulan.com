export async function sendEmail({ to, subject, body }: { to: string, subject: string, body: string }) {
    // In a real app, use Resend, SendGrid, or Nodemailer here.
    console.log("-----------------------------------------");
    console.log(`[MOCK EMAIL SENDING]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log("-----------------------------------------");
    return true;
}
