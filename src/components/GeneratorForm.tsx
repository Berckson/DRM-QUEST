import { useState } from 'react';
import { School, BookText, User, Search, Globe, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface GeneratorFormProps {
  onGenerate: (data: {
    school: string;
    subject: string;
    teacher: string;
    topic: string;
    source: string;
    levels: { teoria: number; facil: number; media: number; dificil: number };
  }) => void;
  isLoading: boolean;
}

const LEVEL_OPTIONS = [
  { key: 'teoria', label: 'Teoria', emoji: '📖', color: 'border-primary/30 bg-accent' },
  { key: 'facil', label: 'Fácil', emoji: '🟢', color: 'border-success/30 bg-success/5' },
  { key: 'media', label: 'Média', emoji: '🟡', color: 'border-warning/30 bg-warning/5' },
  { key: 'dificil', label: 'Difícil', emoji: '🔴', color: 'border-destructive/30 bg-destructive/5' },
];

export function GeneratorForm({ onGenerate, isLoading }: GeneratorFormProps) {
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('');
  const [levels, setLevels] = useState({ teoria: 1, facil: 3, media: 3, dificil: 1 });

  const updateLevel = (key: string, delta: number) => {
    setLevels(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(10, (prev as any)[key] + delta)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate({ school, subject, teacher, topic, source, levels });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
          Criar Nova Atividade
        </h1>
        <p className="text-muted-foreground">
          Preencha os campos abaixo para gerar sua lista de exercícios
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Fields */}
        <Card className="p-5 academic-shadow">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Cabeçalho
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <School className="h-3.5 w-3.5" /> Escola
              </Label>
              <Input
                value={school}
                onChange={e => setSchool(e.target.value)}
                placeholder="Nome da escola"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <BookText className="h-3.5 w-3.5" /> Disciplina
              </Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Ex: Física"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Professor
              </Label>
              <Input
                value={teacher}
                onChange={e => setTeacher(e.target.value)}
                placeholder="Seu nome"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Search */}
        <Card className="p-5 academic-shadow">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Busca
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" /> Tema *
              </Label>
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ex: Teorema de Pitágoras"
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Fonte
              </Label>
              <Input
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="Ex: Toda Matéria"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Level Filters */}
        <Card className="p-5 academic-shadow">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Quantidade por Nível
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LEVEL_OPTIONS.map(opt => (
              <div
                key={opt.key}
                className={`rounded-lg border p-3 text-center ${opt.color} transition-all`}
              >
                <div className="text-lg mb-1">{opt.emoji}</div>
                <div className="text-xs font-medium mb-2">{opt.label}</div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateLevel(opt.key, -1)}
                    className="w-7 h-7 rounded-full border border-border bg-card flex items-center justify-center text-sm font-medium hover:bg-muted transition-colors"
                  >
                    −
                  </button>
                  <span className="text-lg font-semibold w-6 text-center">
                    {(levels as any)[opt.key]}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateLevel(opt.key, 1)}
                    className="w-7 h-7 rounded-full border border-border bg-card flex items-center justify-center text-sm font-medium hover:bg-muted transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 h-12 text-base font-semibold"
          disabled={isLoading || !topic.trim()}
        >
          <Sparkles className="h-5 w-5" />
          {isLoading ? 'Gerando...' : 'Gerar Atividade'}
        </Button>
      </form>
    </motion.div>
  );
}
