export interface Question {
  id: string;
  text: string;
  origin: string;
  level: 'teoria' | 'facil' | 'media' | 'dificil';
  answer: string;
}

export interface Activity {
  id: string;
  school: string;
  subject: string;
  teacher: string;
  topic: string;
  source: string;
  theory: string;
  questions: Question[];
  levels: { teoria: number; facil: number; media: number; dificil: number };
  createdAt: string;
}

export const LEVEL_LABELS: Record<string, string> = {
  teoria: 'Teoria',
  facil: 'Fácil',
  media: 'Média',
  dificil: 'Difícil',
};

export const LEVEL_COLORS: Record<string, string> = {
  teoria: 'bg-accent text-accent-foreground',
  facil: 'bg-success/10 text-success',
  media: 'bg-warning/10 text-warning',
  dificil: 'bg-destructive/10 text-destructive',
};
