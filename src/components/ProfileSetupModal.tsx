import { useState } from 'react';
import { GraduationCap, BookOpenCheck, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TeacherRequestForm } from './TeacherRequestForm';

interface ProfileSetupModalProps {
  open: boolean;
  userId: string;
  email?: string;
  onChoose: (
    choice: 'Aluno' | 'Professor',
    extra?: { full_name?: string; school?: string; phone?: string }
  ) => Promise<boolean>;
}

const OPTIONS = [
  {
    role: 'Aluno' as const,
    icon: GraduationCap,
    title: 'Sou Aluno',
    badge: 'Grátis',
    features: [
      'Até 10 questões reais por simulado',
      'Dashboard de estudos limpa, sem timbre',
      'Correção interativa na tela',
      'PRO vitalício por R$ 24,99 (ilimitado + gabarito comentado)',
    ],
  },
  {
    role: 'Professor' as const,
    icon: BookOpenCheck,
    title: 'Sou Professor',
    badge: 'Grátis (validado)',
    features: [
      'TDs com 20+ questões',
      'Espelhar modelo via upload de PDF',
      'Folha timbrada em 2 colunas para impressão',
      '3 modos de gabarito',
    ],
  },
];

export function ProfileSetupModal({ open, userId, email, onChoose }: ProfileSetupModalProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [teacherFlow, setTeacherFlow] = useState(false);

  const handleStudent = async () => {
    setSaving('Aluno');
    await onChoose('Aluno');
    setSaving(null);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-xl [&>button]:hidden glass-panel max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-serif">Bem-vindo ao DRM Quest</DialogTitle>
          <DialogDescription>
            {teacherFlow
              ? 'Identifique-se para liberarmos as ferramentas docentes.'
              : 'Escolha seu perfil para começar. Isso define suas funcionalidades.'}
          </DialogDescription>
        </DialogHeader>

        {teacherFlow ? (
          <TeacherRequestForm
            userId={userId}
            defaultEmail={email}
            onCancel={() => setTeacherFlow(false)}
            onSubmitted={async (data) => {
              await onChoose('Professor', data);
            }}
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <motion.div
                  key={opt.role}
                  whileHover={{ y: -4 }}
                  className="text-left rounded-xl border border-border/70 hover:border-primary p-5 transition-all duration-300 bg-card/70 backdrop-blur-sm hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </span>
                    <Badge variant={opt.role === 'Professor' ? 'default' : 'secondary'}>{opt.badge}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{opt.title}</h3>
                  <ul className="space-y-1.5">
                    {opt.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-4"
                    size="sm"
                    disabled={!!saving}
                    onClick={() => (opt.role === 'Aluno' ? handleStudent() : setTeacherFlow(true))}
                  >
                    {saving === opt.role ? 'Salvando...' : `Continuar como ${opt.role}`}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
