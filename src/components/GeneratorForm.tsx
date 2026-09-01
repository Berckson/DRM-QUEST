import { useState, useCallback } from 'react';
import {
  School,
  BookText,
  User,
  Search,
  Globe,
  Sparkles,
  FileUp,
  Lock,
  Hash,
  Loader2,
  FileCheck2,
  X,
  Gauge,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { extractPdfText } from '@/lib/pdfExtract';
import { sanitizeText, sanitizeRich } from '@/lib/sanitize';
import {
  SOURCE_OPTIONS,
  DIFFICULTY_FOCUS_OPTIONS,
  STUDENT_MAX_QUESTIONS,
  STUDENT_PRO_MAX_QUESTIONS,
  TEACHER_MAX_QUESTIONS,
  type AnswerKeyMode,
  type GenerationMode,
  type DifficultyFocus,
} from '@/types/td';
import type { GenerateParams } from '@/hooks/useTDs';

interface GeneratorFormProps {
  onGenerate: (params: GenerateParams) => void;
  isLoading: boolean;
  isTeacher: boolean;
  isPro: boolean;
  onUpgrade: () => void;
}

const ANSWER_KEY_OPTIONS: { value: AnswerKeyMode; label: string; desc: string }[] = [
  { value: 'sheet', label: 'Apenas Folha de Respostas', desc: 'Matriz de letras no final do TD.' },
  { value: 'commented', label: 'Gabarito Comentado no PDF', desc: 'Justificativas integradas ao documento.' },
  { value: 'screen', label: 'Apenas Ler na Tela', desc: 'Justificativas em painel; ocultas na impressão.' },
];

export function GeneratorForm({ onGenerate, isLoading, isTeacher, isPro, onUpgrade }: GeneratorFormProps) {
  const canUsePdf = isTeacher || isPro;
  const maxQuestions = isTeacher
    ? TEACHER_MAX_QUESTIONS
    : isPro
    ? STUDENT_PRO_MAX_QUESTIONS
    : STUDENT_MAX_QUESTIONS;

  const [tab, setTab] = useState<GenerationMode>('web');
  const [school, setSchool] = useState('EEEP Deputado Roberto Mesquita');
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [className, setClassName] = useState('');
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState<string>(SOURCE_OPTIONS[0]);
  const [difficultyFocus, setDifficultyFocus] = useState<DifficultyFocus>('misturado');
  const [questionCount, setQuestionCount] = useState(isTeacher ? 10 : 5);
  const [answerKeyMode, setAnswerKeyMode] = useState<AnswerKeyMode>(isTeacher ? 'commented' : 'simple');

  // PDF tab state
  const [pdfTopic, setPdfTopic] = useState('');
  const [pdfText, setPdfText] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Envie um arquivo .pdf');
      return;
    }
    setParsing(true);
    try {
      const text = await extractPdfText(file);
      if (!text) {
        toast.error('Não foi possível ler o texto do PDF');
        return;
      }
      setPdfText(sanitizeRich(text, 8000));
      setPdfName(sanitizeText(file.name, 80));
      toast.success('Modelo carregado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao processar o PDF');
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clamp = (n: number) => Math.max(1, Math.min(maxQuestions, n));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeTopic = sanitizeText(tab === 'web' ? topic : pdfTopic, 160);
    if (!activeTopic) {
      toast.error('Informe o tema da atividade');
      return;
    }
    if (tab === 'pdf' && !pdfText) {
      toast.error('Envie um PDF de modelo primeiro');
      return;
    }
    onGenerate({
      topic: activeTopic,
      source: tab === 'web' ? source : 'Espelho de Modelo (PDF)',
      mode: tab,
      modelText: tab === 'pdf' ? pdfText : undefined,
      questionCount: clamp(questionCount),
      difficultyFocus,
      subject: sanitizeText(subject, 80),
      teacher: sanitizeText(teacher, 120),
      school: sanitizeText(school, 160),
      className: sanitizeText(className, 60),
      answerKeyMode: isTeacher ? answerKeyMode : 'simple',
      authorRole: isTeacher ? 'Professor' : 'Aluno',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-3xl font-serif font-bold text-foreground">
            {isTeacher ? 'Criar Novo TD' : 'Criar Novo Simulado'}
          </h1>
          <Badge variant={isTeacher || isPro ? 'default' : 'secondary'}>
            {isTeacher ? 'Docente' : isPro ? 'PRO' : 'Grátis'}
          </Badge>
        </div>
        <p className="text-muted-foreground">Questões reais de vestibulares em menos de 1 minuto</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cabeçalho apenas para professores */}
        {isTeacher && (
          <Card className="glass-card p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Cabeçalho</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5"><School className="h-3.5 w-3.5" /> Escola</Label>
                <Input value={school} onChange={(e) => setSchool(e.target.value)} maxLength={160} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5"><BookText className="h-3.5 w-3.5" /> Disciplina</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Física" maxLength={80} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Professor</Label>
                <Input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Nome" maxLength={120} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Turma</Label>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Ex: 3º ano A" maxLength={60} className="h-9 text-sm" />
              </div>
            </div>
          </Card>
        )}

        {/* Abas de busca */}
        <Card className="glass-card p-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as GenerationMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="web" className="gap-1.5">
                <Sparkles className="h-4 w-4" /> Usar IA + Fontes da Web
              </TabsTrigger>
              <TabsTrigger value="pdf" className="gap-1.5" disabled={!canUsePdf}>
                {canUsePdf ? <FileUp className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                Espelhar Modelo
                {!canUsePdf && <Badge variant="secondary" className="ml-1 text-[9px] px-1">PRO</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="web" className="mt-4 space-y-4 animate-in fade-in-50 duration-300">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5"><Search className="h-3.5 w-3.5" /> Tema da Atividade *</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Leis de Newton" maxLength={160} className="h-9 text-sm" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Fonte de Pesquisa</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /> Nível de Dificuldade</Label>
                  <Select value={difficultyFocus} onValueChange={(v) => setDifficultyFocus(v as DifficultyFocus)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_FOCUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pdf" className="mt-4 space-y-4 animate-in fade-in-50 duration-300">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-all duration-300 ${
                  dragging ? 'border-primary bg-accent scale-[1.01]' : 'border-border'
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {parsing ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">Lendo PDF...</span>
                  </div>
                ) : pdfName ? (
                  <div className="flex items-center justify-center gap-2 text-success">
                    <FileCheck2 className="h-5 w-5" />
                    <span className="text-sm font-medium">{pdfName}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPdfName(''); setPdfText(''); }}
                      className="z-10 relative rounded p-1 hover:bg-muted"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileUp className="h-6 w-6" />
                    <span className="text-sm font-medium">Subir PDF de Modelo (Molde do TD)</span>
                    <span className="text-xs">Arraste aqui ou clique para selecionar</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5"><Search className="h-3.5 w-3.5" /> Novo Tema para a Atividade *</Label>
                <Input value={pdfTopic} onChange={(e) => setPdfTopic(e.target.value)} placeholder="Ex: Termodinâmica" maxLength={160} className="h-9 text-sm" />
              </div>
            </TabsContent>
          </Tabs>

          {!canUsePdf && (
            <button type="button" onClick={onUpgrade} className="mt-3 w-full text-xs text-primary hover:underline">
              Desbloquear "Espelhar Modelo" e gabaritos comentados com o PRO →
            </button>
          )}
        </Card>

        {/* Quantidade */}
        <Card className="glass-card p-5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-1.5"><Hash className="h-4 w-4" /> Quantidade de questões</Label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQuestionCount((n) => clamp(n - 1))} className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-lg hover:bg-muted transition-colors">−</button>
              <span className="text-xl font-semibold w-8 text-center">{questionCount}</span>
              <button type="button" onClick={() => setQuestionCount((n) => clamp(n + 1))} className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-lg hover:bg-muted transition-colors">+</button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isTeacher
              ? `Modo Professor: até ${maxQuestions} questões por TD.`
              : isPro
              ? `Aluno PRO: geração liberada até ${maxQuestions} questões por simulado.`
              : `Plano grátis: até ${maxQuestions} questões por vez.`}
          </p>
        </Card>

        {/* Gabarito (professor) */}
        {isTeacher && (
          <Card className="glass-card p-5">
            <Label className="text-sm font-semibold mb-3 block">Formato do Gabarito</Label>
            <div className="space-y-2">
              {ANSWER_KEY_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setAnswerKeyMode(opt.value)}
                  className={`w-full text-left rounded-lg border p-3 transition-all duration-200 ${
                    answerKeyMode === opt.value ? 'border-primary bg-accent' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </Card>
        )}

        <Button type="submit" size="lg" className="w-full gap-2 h-12 text-base font-semibold transition-transform hover:scale-[1.01]" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {isLoading ? 'Gerando atividade...' : 'Gerar Atividade'}
        </Button>
      </form>
    </motion.div>
  );
}
