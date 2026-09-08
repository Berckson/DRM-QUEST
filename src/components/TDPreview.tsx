import { useState } from 'react';
import { Copy, ArrowLeft, Check, Printer, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { TDCanvas } from './TDCanvas';
import { StudentQuiz } from './StudentQuiz';
import { LETTERS } from '@/types/td';
import type { TD } from '@/types/td';

interface TDPreviewProps {
  td: TD;
  isTeacher: boolean;
  isPro: boolean;
  onUpdate: (td: TD) => void;
  onBack: () => void;
  onUpgrade: () => void;
}

function buildPlainText(td: TD): string {
  let text = `${td.school}\n`;
  text += `Disciplina: ${td.subject} | Professor(a): ${td.teacher}\n\n`;
  text += `${td.topic.toUpperCase()}\n\n`;
  if (td.theory) text += `RESUMO TEÓRICO\n${td.theory}\n\n`;
  text += `QUESTÕES\n`;
  td.questions.forEach((q, i) => {
    text += `\n${i + 1}. ${q.text}\n`;
    q.alternatives.forEach((alt, idx) => {
      text += `   ${LETTERS[idx]}) ${alt}\n`;
    });
  });
  if (td.answerKeyMode === 'commented') {
    text += `\nGABARITO COMENTADO\n`;
    td.questions.forEach((q, i) => {
      text += `\n${i + 1}. (${q.correct}) ${q.explanation}\n`;
    });
  } else {
    text += `\nGABARITO\n`;
    text += td.questions.map((q, i) => `${i + 1}. ${q.correct}`).join('   ');
    text += '\n';
  }
  return text;
}

export function TDPreview({ td, isTeacher, isPro, onUpdate, onBack, onUpgrade }: TDPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildPlainText(td));
    setCopied(true);
    toast.success('Copiado com sucesso!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Barra de ações (oculta na impressão) */}
      <div className="no-print flex items-center justify-between mb-6 flex-wrap gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={isTeacher ? 'default' : isPro ? 'default' : 'secondary'}>
            {isTeacher ? 'Docente' : isPro ? 'PRO' : 'Grátis'}
          </Badge>

          {isTeacher && td.answerKeyMode === 'screen' && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Eye className="h-4 w-4" /> Gabarito
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Gabarito Comentado (somente tela)</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
                  <div className="space-y-4">
                    {td.questions.map((q, i) => (
                      <div key={q.id} className="text-sm border-b border-border pb-3">
                        <div className="font-semibold mb-1">
                          {i + 1}. Resposta: <span className="text-primary">{q.correct}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}

          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar para Word'}
          </Button>
          <Button size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="h-4 w-4" /> Exportar PDF / Imprimir
          </Button>
        </div>
      </div>

      {isTeacher ? (
        <div className="print-area">
          <TDCanvas td={td} onChange={onUpdate} />
        </div>
      ) : (
        <StudentQuiz td={td} isPro={isPro} onChange={onUpdate} onUpgrade={onUpgrade} />
      )}
    </div>
  );
}
