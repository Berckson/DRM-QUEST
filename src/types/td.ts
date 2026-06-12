export type UserRole = 'Professor' | 'Aluno';

export type AnswerKeyMode = 'simple' | 'sheet' | 'commented' | 'screen';
export type GenerationMode = 'web' | 'pdf';

export type QuestionLevel = 'facil' | 'media' | 'dificil';

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

export const LEVEL_LABELS: Record<QuestionLevel, string> = {
  facil: 'Fácil',
  media: 'Média',
  dificil: 'Difícil',
};

export const LEVEL_COLORS: Record<QuestionLevel, string> = {
  facil: 'bg-success/10 text-success',
  media: 'bg-warning/10 text-warning',
  dificil: 'bg-destructive/10 text-destructive',
};

export const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export const STUDENT_MAX_QUESTIONS = 10;
export const TEACHER_MAX_QUESTIONS = 30;
