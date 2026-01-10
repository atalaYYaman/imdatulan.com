export function maskStudentNumber(studentNumber: string | null | undefined): string {
    if (!studentNumber) return "";
    if (studentNumber.length < 4) return "****"; // Fallback for short content

    // Keep first 2 and last 3 chars (e.g., 20****056)
    const start = studentNumber.slice(0, 2);
    const end = studentNumber.slice(-3);
    return `${start}****${end}`;
}
