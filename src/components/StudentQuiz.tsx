import { useState } from 'react';
import { Check, X, CheckCircle2, Lock, Copy, Trash2, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Editable } from './Editable';
import { LETTERS, LEVEL_LABELS, LEVEL_COLORS } from '@/types/td';
import type { TD, TDQuestion } from '@/types/td';

interface Props {
  td: TD;
  isPro: boolean;
  onChange: (td: TD) => void;
  onUpgrade: () => void;
}

/** Dashboard de Estudos do aluno: sem timbre, com correção interativa. */
export function StudentQuiz({ td, isPro, onChange, onUpgrade }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [corrected, setCorrected] = useState(false);

  const updateQuestion = (q: TDQuestion) =>
    onChange({ ...td, questions: td.questions.map((x) => (x.id === q.id ? q : x)) });

  const removeQuestion = (id: string) =>
    onChange({ ...td, questions: td.questions.filter((q) => q.id !== id) });

  const copyQuestion = async (q: TDQuestion, index: number) => {
    const text = `${index + 1}. ${q.text}\n${q.alternatives.map((a, i) => `${LETTERS[i]}) ${a}`).join('\n')}`;
    await navigator.clipboard.writeText(text);
    toast.success('Questão copiada!');
  };

  const score = td.questions.filter((q) => LETTERS[answers[q.id]] === q.correct).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="print-area space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-serif font-bold uppercase">{td.topic}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {td.questions.length} questões · {td.source}
          </p>
        </header>

        {td.theory && (
          <Card className="glass-card p-5">
            <h2 className="text-sm font-semibold mb-2">Resumo Teórico</h2>
            <Editable
              value={td.theory}
              onCommit={(v) => onChange({ ...td, theory: v })}
              className="whitespace-pre-line block text-sm leading-relaxed text-justify text-muted-foreground"
            />
          </Card>
        )}

        <div className="space-y-4">
          {td.questions.map((q, i) => {
            const selected = answers[q.id];
            const correctIndex = LETTERS.indexOf(q.correct);
            return (
              <Card key={q.id} className="td-question glass-card p-5 break-inside-avoid transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-sm font-bold text-primary">Questão {i + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[10px] ${LEVEL_COLORS[q.level]}`}>
                      {LEVEL_LABELS[q.level]}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => copyQuestion(q, i)}
                      className="no-print rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
                      title="Copiar questão"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="no-print rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Excluir questão"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Editable
                  value={q.text}
                  onCommit={(v) => updateQuestion({ ...q, text: v })}
                  className="text-sm leading-relaxed block"
                />

                <div className="mt-3 space-y-1.5">
                  {q.alternatives.map((alt, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = idx === correctIndex;
                    let cls = 'border-border hover:border-primary/50 hover:bg-muted/50';
                    if (corrected && isCorrect) cls = 'border-success bg-success/10';
                    else if (corrected && isSelected) cls = 'border-destructive bg-destructive/10';
                    else if (isSelected) cls = 'border-primary bg-accent';
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => !corrected && setAnswers((a) => ({ ...a, [q.id]: idx }))}
                        className={`w-full text-left flex gap-2 rounded-lg border p-2.5 text-sm transition-all duration-200 ${cls}`}
                      >
                        <span className="font-semibold shrink-0">{LETTERS[idx]})</span>
                        <span className="flex-1">{alt}</span>
                        {corrected && isCorrect && <Check className="h-4 w-4 text-success shrink-0" />}
                        {corrected && isSelected && !isCorrect && <X className="h-4 w-4 text-destructive shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {corrected && (
                  <div className="mt-3 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed">
                    {isPro ? (
                      <>
                        <span className="font-semibold text-success">Gabarito ({q.correct}): </span>
                        {q.explanation}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={onUpgrade}
                        className="no-print flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Resposta correta: <strong>{q.correct}</strong> — veja a justificativa completa no PRO
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Gabarito simples obrigatório no fim do documento */}
        <Card className="glass-card p-5 break-inside-avoid">
          <h2 className="text-sm font-semibold mb-2">Gabarito</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
            {td.questions.map((q, i) => (
              <span key={q.id} className="font-medium">
                {i + 1}. {q.correct}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="no-print flex flex-col sm:flex-row items-center gap-3">
        {corrected ? (
          <>
            <div className="flex-1 text-sm font-semibold">
              Você acertou {score} de {td.questions.length} questões.
            </div>
            <Button variant="outline" className="gap-2" onClick={() => { setCorrected(false); setAnswers({}); }}>
              <RotateCcw className="h-4 w-4" /> Refazer
            </Button>
          </>
        ) : (
          <Button className="w-full h-11 gap-2 font-semibold" onClick={() => setCorrected(true)}>
            <CheckCircle2 className="h-4 w-4" /> Corrigir Simulado
          </Button>
        )}
      </div>

      {!isPro && (
        <Card className="no-print glass-card p-4 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Desbloqueie simulados ilimitados e gabaritos comentados.
          </div>
          <Button size="sm" className="gap-1.5 shrink-0" onClick={onUpgrade}>
            <Sparkles className="h-3.5 w-3.5" /> Seja PRO
          </Button>
        </Card>
      )}
    </div>
  );
}
