export interface FocusSession {
  id: string;
  category: string;
  duration: number; // saniye cinsinden
  distractionCount: number;
  startTime: number; // timestamp
  endTime: number; // timestamp
  completed: boolean;
}

export type SessionCategory = 'Ders Çalışma' | 'Kodlama' | 'Proje' | 'Kitap Okuma';

export const SESSION_CATEGORIES: SessionCategory[] = [
  'Ders Çalışma',
  'Kodlama',
  'Proje',
  'Kitap Okuma',
];
