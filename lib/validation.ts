
export async function validateTCKN(tc: string, name: string, surname: string, birthYear: number): Promise<boolean> {
    // Mock Validation: Only check format and algorithm
    const trimmedTC = tc.trim();

    if (!/^[1-9][0-9]{9}[02468]$/.test(trimmedTC)) {
        console.warn("TCKN Algo: Regex Failed");
        return false;
    }

    const digits = trimmedTC.split('').map(Number);
    const d = digits;
    const sumOdd = d[0] + d[2] + d[4] + d[6] + d[8];
    const sumEven = d[1] + d[3] + d[5] + d[7];
    const check10 = ((sumOdd * 7) - sumEven) % 10;
    const check11 = (d.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;

    if (d[9] !== check10 || d[10] !== check11) {
        console.warn("TCKN Algo: Checksum Failed");
        return false;
    }

    // If format is correct, we return true (Mocking Success)
    // We still uppercase inputs for consistency in DB but validation is "passed"
    return true;
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) {
        return { isValid: false, message: "Şifre en az 8 karakter olmalıdır." };
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return { isValid: false, message: "Şifre hem harf hem de rakam içermelidir." };
    }
    return { isValid: true };
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
