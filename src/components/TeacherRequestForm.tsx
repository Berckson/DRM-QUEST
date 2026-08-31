import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeText, isValidEmail, isValidPhone, formatPhone } from '@/lib/sanitize';

interface Props {
  userId: string;
  defaultEmail?: string;
  onSubmitted: (data: { full_name: string; school: string; phone: string }) => Promise<void>;
  onCancel: () => void;
}

export function TeacherRequestForm({ userId, defaultEmail = '', onSubmitted, onCancel }: Props) {
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('EEEP Deputado Roberto Mesquita');
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = {
      full_name: sanitizeText(fullName, 120),
      school: sanitizeText(school, 160),
      institutional_email: sanitizeText(email, 160).toLowerCase(),
      phone: sanitizeText(phone, 25),
    };
    if (clean.full_name.length < 5) return toast.error('Informe seu nome completo');
    if (clean.school.length < 3) return toast.error('Informe o nome da escola');
    if (!isValidEmail(clean.institutional_email)) return toast.error('E-mail institucional inválido');
    if (!isValidPhone(clean.phone)) return toast.error('Telefone/WhatsApp inválido');

    setSaving(true);
    const { error } = await supabase.from('teacher_requests').insert({ user_id: userId, ...clean });
    if (error) {
      setSaving(false);
      toast.error('Erro ao enviar solicitação');
      return;
    }
    await onSubmitted({ full_name: clean.full_name, school: clean.school, phone: clean.phone });
    setSaving(false);
    toast.success('Solicitação enviada! Aguarde a validação.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg bg-accent/60 p-3 text-xs text-accent-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          O acesso docente é gratuito, porém validado manualmente pela coordenação. Preencha seus dados para análise.
        </span>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Nome completo do professor *</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} placeholder="Ex: Maria da Silva Souza" className="h-9 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Nome completo da escola *</Label>
        <Input value={school} onChange={(e) => setSchool(e.target.value)} maxLength={160} className="h-9 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">E-mail institucional *</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} placeholder="nome@professor.ce.gov.br" className="h-9 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Telefone / WhatsApp *</Label>
        <Input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(85) 99999-9999" className="h-9 text-sm" />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
          Voltar
        </Button>
        <Button type="submit" className="flex-1 gap-2" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar solicitação
        </Button>
      </div>
    </form>
  );
}
