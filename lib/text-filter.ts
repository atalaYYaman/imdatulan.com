
// Basic Profanity Filter
// Includes common Turkish and English bad words.
// In a real production app, this should be more robust or use an external service.

const BAD_WORDS = [
    // English
    "fuck", "shit", "bitch", "asshole", "dick", "pussy", "bastard", "whore", "slut", "cunt",
    // Turkish
    "amk", "aq", "sik", "siktir", "pic", "piç", "yarrak", "yarak", "oç", "orospu", "kahpe", "göt", "got", "ibne", "yavşak"
];

export function cleanText(text: string): string {
    if (!text) return "";

    let cleaned = text;

    // Simple case-insensitive replacement
    // This is a naive implementation. For better results, use a library like 'bad-words' with custom dictionary.

    BAD_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, "****");
    });

    return cleaned;
}
