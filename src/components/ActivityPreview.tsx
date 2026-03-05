import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Copy, FileDown, ArrowLeft, Check, Printer } from 'lucide-react';
import { Activity, Question } from '@/hooks/useActivities';
import { QuestionCard } from './QuestionCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ActivityPreviewProps {
  activity: Activity;
  onUpdate: (updated: Activity) => void;
  onBack: () => void;
}

export function ActivityPreview({ activity, onUpdate, onBack }: ActivityPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [editingTheory, setEditingTheory] = useState(false);
  const [theory, setTheory] = useState(activity.theory);

  const handleQuestionUpdate = (updated: Question) => {
    onUpdate({
      ...activity,
      questions: activity.questions.map(q => q.id === updated.id ? updated : q),
    });
  };

  const handleTheoryBlur = () => {
    setEditingTheory(false);
    if (theory !== activity.theory) {
      onUpdate({ ...activity, theory });
    }
  };

  const handleCopy = async () => {
    const text = buildPlainText(activity);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 20;
    const pageWidth = 210 - 2 * margin;
    let y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(activity.school || 'Escola', margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Disciplina: ${activity.subject} | Professor(a): ${activity.teacher}`, margin, y);
    y += 5;
    doc.text(`Data: ${format(new Date(activity.createdAt), "dd/MM/yyyy", { locale: ptBR })}`, margin, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(activity.topic, margin, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const theoryLines = doc.splitTextToSize(activity.theory.replace(/\*\*/g, '').replace(/•/g, '-'), pageWidth);
    for (const line of theoryLines) {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 5;
    }
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Questões', margin, y);
    y += 8;

    activity.questions.forEach((q, i) => {
      if (y > 255) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const origin = q.origin !== 'Autoral' ? ` [${q.origin}]` : '';
      doc.text(`${i + 1}.${origin}`, margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const qLines = doc.splitTextToSize(q.text, pageWidth);
      for (const line of qLines) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 5;
      }
      y += 4;
    });

    // Gabarito
    if (y > 240) { doc.addPage(); y = margin; }
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Gabarito Comentado', margin, y);
    y += 8;

    activity.questions.forEach((q, i) => {
      if (y > 255) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${i + 1}.`, margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const aLines = doc.splitTextToSize(q.answer, pageWidth);
      for (const line of aLines) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 4;
      }
      y += 3;
    });

    doc.save(`${activity.topic.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF gerado com sucesso!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5">
            <FileDown className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      <div ref={contentRef} className="space-y-6">
        {/* Header */}
        <Card className="p-5 academic-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <Input
              value={activity.school}
              onChange={e => onUpdate({ ...activity, school: e.target.value })}
              className="text-lg font-serif font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
              placeholder="Nome da Escola"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(activity.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Disciplina: <strong className="text-foreground">{activity.subject}</strong></span>
            <span>Professor(a): <strong className="text-foreground">{activity.teacher}</strong></span>
          </div>
        </Card>

        {/* Topic & Theory */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">{activity.topic}</h2>
          {activity.source && (
            <p className="text-xs text-muted-foreground mb-4">Fonte: {activity.source}</p>
          )}

          <Card className="p-5 academic-shadow bg-accent/30">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent-foreground mb-3">
              📖 Resumo Teórico
            </h3>
            {editingTheory ? (
              <Textarea
                value={theory}
                onChange={e => setTheory(e.target.value)}
                onBlur={handleTheoryBlur}
                autoFocus
                className="min-h-[120px] text-sm"
              />
            ) : (
              <div
                className="text-sm text-foreground leading-relaxed whitespace-pre-line cursor-pointer hover:bg-accent/50 rounded p-2 -m-2 transition-colors"
                onClick={() => setEditingTheory(true)}
                title="Clique para editar"
              >
                {activity.theory}
              </div>
            )}
          </Card>
        </div>

        {/* Questions */}
        <div>
          <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
            Questões ({activity.questions.length})
          </h3>
          <div className="space-y-3">
            {activity.questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                onUpdate={handleQuestionUpdate}
              />
            ))}
          </div>
        </div>

        {/* Gabarito */}
        <Card className="p-5 academic-shadow">
          <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
            Gabarito Comentado
          </h3>
          <div className="space-y-3">
            {activity.questions.map((q, i) => (
              <div key={q.id} className="flex gap-2 text-sm">
                <span className="font-semibold text-primary shrink-0">{i + 1}.</span>
                <p className="text-muted-foreground leading-relaxed">{q.answer}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function buildPlainText(activity: Activity): string {
  let text = '';
  text += `${activity.school}\n`;
  text += `Disciplina: ${activity.subject} | Professor(a): ${activity.teacher}\n`;
  text += `Data: ${format(new Date(activity.createdAt), "dd/MM/yyyy", { locale: ptBR })}\n\n`;
  text += `${activity.topic}\n`;
  if (activity.source) text += `Fonte: ${activity.source}\n`;
  text += `\n--- RESUMO TEÓRICO ---\n${activity.theory}\n\n`;
  text += `--- QUESTÕES ---\n`;
  activity.questions.forEach((q, i) => {
    const origin = q.origin !== 'Autoral' ? ` [${q.origin}]` : '';
    text += `\n${i + 1}.${origin} ${q.text}\n`;
  });
  text += `\n--- GABARITO COMENTADO ---\n`;
  activity.questions.forEach((q, i) => {
    text += `\n${i + 1}. ${q.answer}\n`;
  });
  return text;
}
