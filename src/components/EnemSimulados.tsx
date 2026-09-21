import { useState } from 'react';
import { Play, Loader2, Sparkles, Timer, Hash } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import {
  ENEM_AREAS,
  STUDENT_MAX_QUESTIONS,
  STUDENT_PRO_MAX_QUESTIONS,
  type EnemArea,
} from '@/types/td';

interface Props {
  isPro: boolean;
  isLoading: boolean;
  loadingAreaId: string | null;
  onStart: (area: EnemArea, count: number) => void;
  onUpgrade: () => void;
}

/** Simulados Oficiais ENEM organizados nas 4 grandes áreas. */
export function EnemSimulados({ isPro, isLoading, loadingAreaId, onStart, onUpgrade }: Props) {
  const max = isPro ? STUDENT_PRO_MAX_QUESTIONS : STUDENT_MAX_QUESTIONS;
  const [count, setCount] = useState(isPro ? 15 : 10);
  const clamp = (n: number) => Math.max(5, Math.min(max, n));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-3xl font-serif font-bold">Simulados Oficiais ENEM</h1>
          <Badge variant={isPro ? 'default' : 'secondary'}>{isPro ? 'PRO' : 'Grátis'}</Badge>
        </div>
        <p className="text-muted-foreground">
          Escolha a área, cronometre sua prova e receba a análise de desempenho na hora.
        </p>
      </div>

      <Card className="glass-card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Hash className="h-4 w-4" /> Questões por simulado
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            {isPro ? `Aluno PRO: até ${max} questões.` : `Plano grátis: até ${max} questões por simulado.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCount((n) => clamp(n - 5))}
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-lg hover:bg-muted transition-colors"
          >
            −
          </button>
          <span className="text-xl font-semibold w-8 text-center">{count}</span>
          <button
            type="button"
            onClick={() => setCount((n) => clamp(n + 5))}
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-lg hover:bg-muted transition-colors"
          >
            +
          </button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {ENEM_AREAS.map((area, i) => (
          <motion.div
            key={area.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <Card className="glass-card h-full overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
              <div className={`bg-gradient-to-br ${area.accent} p-5 flex-1`}>
                <div className="text-3xl mb-2">{area.emoji}</div>
                <h2 className="text-base font-semibold leading-snug">{area.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">{area.subjects}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" /> Tempo sugerido: {count * 3} min
                </div>
              </div>
              <div className="p-4 pt-0">
                <Button
                  className="w-full gap-2 font-semibold transition-transform hover:scale-[1.01]"
                  disabled={isLoading}
                  onClick={() => onStart(area, clamp(count))}
                >
                  {loadingAreaId === area.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {loadingAreaId === area.id ? 'Montando prova...' : 'Iniciar Simulado'}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {!isPro && (
        <Card className="glass-card mt-6 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            No PRO você libera simulados maiores e o gabarito comentado alternativa por alternativa.
          </div>
          <Button size="sm" className="gap-1.5" onClick={onUpgrade}>
            <Sparkles className="h-3.5 w-3.5" /> Seja PRO
          </Button>
        </Card>
      )}
    </div>
  );
}
