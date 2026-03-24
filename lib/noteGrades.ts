import type { NoteLetterGrade } from '@prisma/client';

export const NOTE_LETTER_GRADES: NoteLetterGrade[] = [
  'AA',
  'BA',
  'BB',
  'CB',
  'CC',
  'DC',
  'DD',
  'FD',
  'FF',
];

export const GRADE_TO_SCORE: Record<NoteLetterGrade, number> = {
  AA: 10,
  BA: 8,
  BB: 7,
  CB: 6,
  CC: 5,
  DC: 4,
  DD: 3,
  FD: 2,
  FF: 1,
};

export type GradeTier = 'positiveGreen' | 'warmYellow' | 'negativeRed' | 'unratedGray';

const SCORE_ORDER: NoteLetterGrade[] = [
  'FF',
  'FD',
  'DD',
  'DC',
  'CC',
  'CB',
  'BB',
  'BA',
  'AA',
];

export function gradeToScore(grade: NoteLetterGrade): number {
  return GRADE_TO_SCORE[grade];
}

export function tierForGrade(grade: NoteLetterGrade): GradeTier {
  if (grade === 'AA' || grade === 'BA' || grade === 'BB') return 'positiveGreen';
  if (grade === 'CB' || grade === 'CC' || grade === 'DC') return 'warmYellow';
  return 'negativeRed';
}

/** Üst şerit / accent: hafif gradient sınıfları (tema uyumlu) */
export function bannerStripClasses(tier: GradeTier): string {
  switch (tier) {
    case 'positiveGreen':
      return 'bg-gradient-to-r from-emerald-500/90 via-green-500/85 to-teal-500/80';
    case 'warmYellow':
      return 'bg-gradient-to-r from-amber-400/90 via-yellow-500/80 to-amber-500/85';
    case 'negativeRed':
      return 'bg-gradient-to-r from-rose-500/85 via-red-500/80 to-orange-600/75';
    default:
      return 'bg-gradient-to-r from-muted via-muted-foreground/25 to-muted';
  }
}

export function unratedMessage(): string {
  return 'Hoca daha okumadı';
}

/** Kart glow — hover ile hafif renk ipucu */
export function cardGlowClasses(tier: GradeTier): string {
  switch (tier) {
    case 'positiveGreen':
      return 'from-emerald-500/30 to-green-500/25';
    case 'warmYellow':
      return 'from-amber-500/30 to-yellow-500/20';
    case 'negativeRed':
      return 'from-rose-500/30 to-red-500/25';
    default:
      return 'from-muted-foreground/15 to-muted-foreground/10';
  }
}

/** Ortalama skordan en yakın harf (10'luk skor uzayında) */
export function averageScoreToLetter(average: number): NoteLetterGrade {
  let best: NoteLetterGrade = 'CC';
  let bestDist = Infinity;
  for (const g of SCORE_ORDER) {
    const d = Math.abs(GRADE_TO_SCORE[g] - average);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}

export function tierForAverageScore(average: number): GradeTier {
  return tierForGrade(averageScoreToLetter(average));
}

export function formatRatingSummary(average: number, letter: NoteLetterGrade): string {
  const rounded = Math.round(average * 10) / 10;
  return `${rounded}/10 · ${letter}`;
}
