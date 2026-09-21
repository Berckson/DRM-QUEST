import { useEffect, useMemo, useState } from 'react';
import {
  Timer,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Check,
  Lock,
  RotateCcw,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LETTERS, LEVEL_LABELS, LEVEL_COLORS } from '@/types/td';
import type { TD } from '@/types/td';

interface Props {
  td: TD;
  isPro: boolean;
  onExit: () => void;
  onUpgrade: () => void;
}

function formatTime(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Modo prova imersivo: cronômetro, navegação, marcação para revisão e análise de desempenho. */
export function ExamMode({ td, isPro, onExit, onUpgrade }: Props) {
  const total = td.questions.length;
  /** 3 minutos por questão, padrão ENEM aproximado. */
  const allotted = total * 180;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [finished]);

  const answeredCount = Object.keys(answers).length;
  const remaining = Math.max(0, allotted - elapsed);

  const results = useMemo(
    () =>
      td.questions.map((q) => ({
        q,
        chosen: answers[q.id],
        correctIndex: LETTERS.indexOf(q.correct),
        hit: LETTERS[answers[q.id]] === q.correct,
      })),
    [td.questions, answers]
  );
  const hits = results.filter((r) => r.hit).length;
  const misses = total - hits;

  const restart = () => {
    setAnswers({});
    setFlags({});
    setElapsed(0);
    setIndex(0);
    setFinished(false);
  };

  if (finished) {
    const pct = total ? Math.round((hits / total) * 100) : 0;
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">Painel de Desempenho</h2>
              <p className="text-sm text-muted-foreground">{td.topic}</p>
            </div>
            <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> Simulado concluído</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Tempo total', value: formatTime(elapsed), cls: 'text-primary' },
              { label: 'Acertos', value: String(hits), cls: 'text-success' },
              { label: 'Erros', value: String(misses), cls: 'text-destructive' },
              { label: 'Aproveitamento', value: `${pct}%`, cls: 'text-foreground' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-muted/40 p-3 text-center">
                <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          <Progress value={pct} className="mt-4 h-2" />

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="gap-2 flex-1" onClick={restart}>
              <RotateCcw className="h-4 w-4" /> Refazer simulado
            </Button>
            <Button variant="ghost" className="gap-2 flex-1" onClick={onExit}>
              <LogOut className="h-4 w-4" /> Sair do modo prova
            </Button>
          </div>
        </Card>

        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Gabarito comentado</h3>

        {results.map(({ q, chosen, correctIndex, hit }, i) => (
          <Card key={q.id} className="glass-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-bold text-primary">Questão {i + 1}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className={`text-[10px] ${LEVEL_COLORS[q.level]}`}>
                  {LEVEL_LABELS[q.level]}
                </Badge>
                <Badge variant={hit ? 'default' : 'destructive'} className="text-[10px]">
                  {hit ? 'Acertou' : chosen === undefined ? 'Em branco' : 'Errou'}
                </Badge>
              </div>
            </div>

            <p className="text-sm leading-relaxed whitespace-pre-line">{q.text}</p>

            <div className="space-y-1.5">
              {q.alternatives.map((alt, idx) => {
                const isCorrect = idx === correctIndex;
                const isChosen = chosen === idx;
                const cls = isCorrect
                  ? 'border-success bg-success/10'
                  : isChosen
                  ? 'border-destructive bg-destructive/10'
                  : 'border-border';
                return (
                  <div key={idx} className={`flex gap-2 rounded-lg border p-2.5 text-sm ${cls}`}>
                    <span className="font-semibold shrink-0">{LETTERS[idx]})</span>
                    <span className="flex-1">{alt}</span>
                    {isCorrect && <Check className="h-4 w-4 text-success shrink-0" />}
                    {isChosen && !isCorrect && <X className="h-4 w-4 text-destructive shrink-0" />}
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg bg-muted/60 p-3 text-xs leading-relaxed">
              {isPro ? (
                <>
                  <span className="font-semibold text-success">Resposta {q.correct}: </span>
                  {q.explanation}
                </>
              ) : (
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Resposta correta: <strong>{q.correct}</strong> — veja a explicação alternativa por alternativa no PRO
                </button>
              )}
            </div>
          </Card>
        ))}

        {!isPro && (
          <Card className="glass-card p-4 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Transforme cada erro em aprendizado com o gabarito comentado completo.
            </div>
            <Button size="sm" className="gap-1.5 shrink-0" onClick={onUpgrade}>
              <Sparkles className="h-3.5 w-3.5" /> Seja PRO
            </Button>
          </Card>
        )}
      </div>
    );
  }

  const q = td.questions[index];
  if (!q) return null;
  const selected = answers[q.id];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Barra do cronômetro */}
      <Card className="glass-panel sticky top-14 z-10 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Timer className="h-4 w-4 text-primary" />
            {formatTime(elapsed)}
          </div>
          <span className="text-xs text-muted-foreground">Restante sugerido: {formatTime(remaining)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {answeredCount}/{total} respondidas
          </span>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onExit}>
            <LogOut className="h-3.5 w-3.5" /> Sair
          </Button>
        </div>
      </Card>

      <Progress value={(answeredCount / total) * 100} className="h-1.5" />

      {/* Navegação rápida */}
      <div className="flex flex-wrap gap-1.5">
        {td.questions.map((item, i) => {
          const done = answers[item.id] !== undefined;
          const flagged = flags[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-8 w-8 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                i === index
                  ? 'border-primary bg-primary text-primary-foreground'
                  : flagged
                  ? 'border-warning bg-warning/15 text-warning'
                  : done
                  ? 'border-primary/40 bg-accent text-accent-foreground'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <Card className="glass-card p-5 sm:p-6 space-y-4 animate-in fade-in-50 duration-200">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm font-bold text-primary">Questão {index + 1} de {total}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] ${LEVEL_COLORS[q.level]}`}>
              {LEVEL_LABELS[q.level]}
            </Badge>
            <Button
              variant={flags[q.id] ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}
            >
              <Flag className="h-3.5 w-3.5" /> {flags[q.id] ? 'Marcada' : 'Marcar'}
            </Button>
          </div>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-line">{q.text}</p>

        <div className="space-y-2">
          {q.alternatives.map((alt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
              className={`w-full text-left flex gap-2 rounded-lg border p-3 text-sm transition-all duration-200 ${
                selected === idx ? 'border-primary bg-accent' : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <span className="font-semibold shrink-0">{LETTERS[idx]})</span>
              <span className="flex-1">{alt}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        {index < total - 1 ? (
          <Button className="flex-1 gap-1.5" onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}>
            Próxima <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="flex-1 gap-1.5 font-semibold" onClick={() => setFinished(true)}>
            <CheckCircle2 className="h-4 w-4" /> Finalizar e ver desempenho
          </Button>
        )}
      </div>

      {index < total - 1 && (
        <Button variant="ghost" className="w-full gap-1.5 text-xs" onClick={() => setFinished(true)}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Encerrar simulado agora
        </Button>
      )}
    </div>
  );
}
