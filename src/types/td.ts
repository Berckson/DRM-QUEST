export type UserRole = 'Professor' | 'Aluno';
export type UserType = 'ALUNO' | 'PROFESSOR' | 'ADMIN';

export type AnswerKeyMode = 'simple' | 'sheet' | 'commented' | 'screen';
export type GenerationMode = 'web' | 'pdf';

export type QuestionLevel = 'facil' | 'media' | 'dificil';
export type DifficultyFocus = 'misturado' | 'facil' | 'media' | 'dificil';

export interface TDQuestion {
  id: string;
  /** Enunciado completo, iniciando com a banca, ex: "[ENEM 2025] ..." */
  text: string;
  origin: string;
  /** Exatamente 5 alternativas (A-E), apenas o conteúdo, sem a letra. */
  alternatives: string[];
  /** Letra da alternativa correta: 'A' | 'B' | 'C' | 'D' | 'E' */
  correct: string;
  /** Justificativa / gabarito comentado da IA */
  explanation: string;
  level: QuestionLevel;
}

export interface TD {
  id: string;
  school: string;
  subject: string;
  teacher: string;
  className: string;
  topic: string;
  source: string;
  mode: GenerationMode;
  theory: string;
  questions: TDQuestion[];
  questionCount: number;
  answerKeyMode: AnswerKeyMode;
  authorRole: UserRole;
  createdAt: string;
}

export const SOURCE_OPTIONS = [
  'Vestibulares Reais/ENEM',
  'Toda Matéria',
  'Brasil Escola',
  'Todas as Fontes',
] as const;

export const DIFFICULTY_FOCUS_OPTIONS: { value: DifficultyFocus; label: string }[] = [
  { value: 'misturado', label: 'Misturado' },
  { value: 'facil', label: 'Foco em Fáceis' },
  { value: 'media', label: 'Foco em Médias' },
  { value: 'dificil', label: 'Foco em Difíceis' },
];

export const LEVEL_LABELS: Record<QuestionLevel, string> = {
  facil: 'Fácil',
  media: 'Médio',
  dificil: 'Difícil',
};

export const LEVEL_COLORS: Record<QuestionLevel, string> = {
  facil: 'bg-success/15 text-success border-success/30',
  media: 'bg-warning/15 text-warning border-warning/30',
  dificil: 'bg-destructive/15 text-destructive border-destructive/30',
};

export const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export const STUDENT_MAX_QUESTIONS = 10;
export const STUDENT_PRO_MAX_QUESTIONS = 30;
export const TEACHER_MAX_QUESTIONS = 30;
