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
import {
  SOURCE_OPTIONS,
  STUDENT_MAX_QUESTIONS,
  TEACHER_MAX_QUESTIONS,
  type UserRole,
  type AnswerKeyMode,
  type GenerationMode,
} from '@/types/td';
import type { GenerateParams } from '@/hooks/useTDs';

interface GeneratorFormProps {
  onGenerate: (params: GenerateParams) => void;
  isLoading: boolean;
  role: UserRole;
}

const ANSWER_KEY_OPTIONS: { value: AnswerKeyMode; label: string; desc: string }[] = [
  { value: 'sheet', label: 'Apenas Folha de Respostas', desc: 'Matriz de letras no final do TD.' },
  { value: 'commented', label: 'Gabarito Comentado no PDF', desc: 'Justificativas integradas ao documento.' },
  { value: 'screen', label: 'Apenas Ler na Tela', desc: 'Justificativas em painel; ocultas na impressão.' },
];

export function GeneratorForm({ onGenerate, isLoading, role }: GeneratorFormProps) {
  const isPro = role === 'Professor';
  const maxQuestions = isPro ? TEACHER_MAX_QUESTIONS : STUDENT_MAX_QUESTIONS;

  const [tab, setTab] = useState<GenerationMode>('web');
  const [school, setSchool] = useState('EEEP Deputado Roberto Mesquita');
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState<string>(SOURCE_OPTIONS[0]);
  const [questionCount, setQuestionCount] = useState(isPro ? 10 : 5);
  const [answerKeyMode, setAnswerKeyMode] = useState<AnswerKeyMode>(isPro ? 'commented' : 'simple');

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
      setPdfText(text);
      setPdfName(file.name);
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
    const activeTopic = tab === 'web' ? topic : pdfTopic;
    if (!activeTopic.trim()) {
      toast.error('Informe o tema da atividade');
      return;
    }
    if (tab === 'pdf' && !pdfText) {
      toast.error('Envie um PDF de modelo primeiro');
      return;
    }
    onGenerate({
      topic: activeTopic.trim(),
      source: tab === 'web' ? source : 'Espelho de Modelo (PDF)',
      mode: tab,
      modelText: tab === 'pdf' ? pdfText : undefined,
      questionCount,
      subject,
      teacher,
      school,
      className: '',
      answerKeyMode: isPro ? answerKeyMode : 'simple',
      authorRole: role,
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
          <h1 className="text-3xl font-serif font-bold text-foreground">Criar Nova Atividade</h1>
          <Badge variant={isPro ? 'default' : 'secondary'}>{isPro ? 'PRO' : 'Beta'}</Badge>
        </div>
        <p className="text-muted-foreground">Gere sua lista de exercícios em menos de 1 minuto</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <Card className="p-5 academic-shadow">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Cabeçalho
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <School className="h-3.5 w-3.5" /> Escola
              </Label>
              <Input value={school} onChange={(e) => setSchool(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <BookText className="h-3.5 w-3.5" /> Disciplina
              </Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Física" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Professor
              </Label>
              <Input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Nome" className="h-9 text-sm" />
            </div>
          </div>
        </Card>

        {/* Search Tabs */}
        <Card className="p-5 academic-shadow">
          <Tabs value={tab} onValueChange={(v) => setTab(v as GenerationMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="web" className="gap-1.5">
                <Sparkles className="h-4 w-4" /> Usar IA + Web
              </TabsTrigger>
              <TabsTrigger value="pdf" className="gap-1.5" disabled={!isPro}>
                {isPro ? <FileUp className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                Espelhar Modelo
                {!isPro && <Badge variant="secondary" className="ml-1 text-[9px] px-1">PRO</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="web" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" /> Tema da Atividade *
                </Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Leis de Newton"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Fonte de Pesquisa
                </Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="pdf" className="mt-4 space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  dragging ? 'border-primary bg-accent' : 'border-border'
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
                <Label className="text-xs flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" /> Novo Tema para a Atividade *
                </Label>
                <Input
                  value={pdfTopic}
                  onChange={(e) => setPdfTopic(e.target.value)}
                  placeholder="Ex: Termodinâmica"
                  className="h-9 text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Question count */}
        <Card className="p-5 academic-shadow">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Hash className="h-4 w-4" /> Quantidade de questões
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuestionCount((n) => clamp(n - 1))}
                className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-lg hover:bg-muted transition-colors"
              >
                −
              </button>
              <span className="text-xl font-semibold w-8 text-center">{questionCount}</span>
              <button
                type="button"
                onClick={() => setQuestionCount((n) => clamp(n + 1))}
                className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-lg hover:bg-muted transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isPro
              ? `Versão PRO: até ${maxQuestions} questões.`
              : `Versão Beta: até ${maxQuestions} questões por vez.`}
          </p>
        </Card>

        {/* Answer key (Professor only) */}
        {isPro && (
          <Card className="p-5 academic-shadow">
            <Label className="text-sm font-semibold mb-3 block">Formato do Gabarito</Label>
            <div className="space-y-2">
              {ANSWER_KEY_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setAnswerKeyMode(opt.value)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
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

        <Button type="submit" size="lg" className="w-full gap-2 h-12 text-base font-semibold" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {isLoading ? 'Gerando atividade...' : 'Gerar Atividade'}
        </Button>
      </form>
    </motion.div>
  );
}
