import { useState } from 'react';
import { GraduationCap, BookOpenCheck, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import type { UserRole } from '@/types/td';

interface ProfileSetupModalProps {
  open: boolean;
  onSelect: (role: UserRole) => Promise<void>;
}

const OPTIONS: {
  role: UserRole;
  icon: typeof GraduationCap;
  title: string;
  badge: string;
  features: string[];
}[] = [
  {
    role: 'Aluno',
    icon: GraduationCap,
    title: 'Sou Aluno',
    badge: 'Versão Beta',
    features: [
      'Até 10 questões por atividade',
      'Folha em coluna única',
      'Gabarito simples (apenas as letras)',
    ],
  },
  {
    role: 'Professor',
    icon: BookOpenCheck,
    title: 'Sou Professor',
    badge: 'Versão PRO',
    features: [
      'Até 30 questões por atividade',
      'Espelhar modelo via PDF',
      'Layout em 2 colunas + gabarito avançado',
    ],
  },
];

export function ProfileSetupModal({ open, onSelect }: ProfileSetupModalProps) {
  const [saving, setSaving] = useState<UserRole | null>(null);

  const handleSelect = async (role: UserRole) => {
    setSaving(role);
    await onSelect(role);
    setSaving(null);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-xl [&>button]:hidden">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-serif">Bem-vindo ao LucsQuestions</DialogTitle>
          <DialogDescription>
            Para começar, escolha o seu perfil. Isso define as funcionalidades disponíveis.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4 mt-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSaving = saving === opt.role;
            return (
              <motion.button
                key={opt.role}
                whileHover={{ y: -3 }}
                disabled={!!saving}
                onClick={() => handleSelect(opt.role)}
                className="text-left rounded-xl border-2 border-border hover:border-primary p-5 transition-colors bg-card disabled:opacity-60"
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
                <Button className="w-full mt-4" size="sm" disabled={!!saving}>
                  {isSaving ? 'Salvando...' : `Continuar como ${opt.role}`}
                </Button>
              </motion.button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
