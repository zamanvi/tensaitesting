// Shapes returned by GET /api/student/cv (see StudentCvController::payload).

export type CvLang = 'en' | 'bn' | 'ja';

export interface CvQuestion {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email' | 'tel';
  options: string[];
  required: boolean;
  placeholder: string | null;
  hint: string | null;
  group: string;
  value?: string;   // present on interview.all: the current answer
}

export interface CvInterviewState {
  question: CvQuestion | null;
  answered: number;
  completed: number;   // answered + skipped
  total: number;
  skipped: string[];
  all: CvQuestion[];
}

export interface CvPreviewItem { key: string; label: string; value: string; type: string }
export interface CvPreviewSection { title: string; items: CvPreviewItem[] }
export interface CvPreviewData {
  name: string | null;
  headline: string | null;
  summary: string | null;
  sections: CvPreviewSection[];
  progress: number;
}

export interface CvState {
  enabled: boolean;
  paused: boolean;
  stage: 'filling' | 'review' | 'sent' | null;
  missing: string[];
  application: { id: number; application_code: string; progress: number; status: string } | null;
  interview: CvInterviewState | null;
  preview: CvPreviewData | null;
  assistant: { used: number; limit: number; remaining: number; summary_available: boolean } | null;
}

// Form labels and choices are stored as "English / বাংলা". Show the half that
// matches the language switch (Japanese falls back to English). Only ever used
// on labels and on choices from a list, never on what the person typed.
export function pickLang(text: string, lang: CvLang): string {
  const parts = text.split(' / ');
  if (parts.length < 2) return text;
  return lang === 'bn' ? parts.slice(1).join(' / ') : parts[0];
}
