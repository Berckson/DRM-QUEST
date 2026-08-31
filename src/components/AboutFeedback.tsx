import { useState } from 'react';
import { Sparkles, Clock, ShieldCheck, Send, Loader2, MessageSquareHeart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeText, isValidEmail } from '@/lib/sanitize';

const PILLARS = [
  { icon: Clock, title: 'Menos de 1 minuto', text: 'Do tema à folha pronta para impressão, sem digitação manual.' },
  { icon: Sparkles, title: 'Questões reais', text: 'Banco de itens de ENEM, FUVEST, ITA, UNICAMP e outros vestibulares.' },
  { icon: ShieldCheck, title: 'Dados protegidos', text: 'Cada conta acessa somente o próprio conteúdo, com criptografia e RLS.' },
];

export function AboutFeedback({ userId, email }: { userId: string; email?: string }) {
  const [name, setName] = useState('');
  const [mail, setMail] = useState(email ?? '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = {
      name: sanitizeText(name, 100),
      email: sanitizeText(mail, 160).toLowerCase(),
      message: sanitizeText(message, 1000),
    };
    if (clean.message.length < 10) return toast.error('Escreva ao menos 10 caracteres');
    if (clean.email && !isValidEmail(clean.email)) return toast.error('E-mail inválido');
    setSending(true);
    const { error } = await supabase.from('feedbacks').insert({ user_id: userId, ...clean });
    setSending(false);
    if (error) return toast.error('Erro ao enviar feedback');
    setMessage('');
    toast.success('Obrigado! Sua sugestão foi registrada.');
  };

  return (
    <section id="sobre" className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-serif font-bold">Sobre o DRM Quest</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          O DRM Quest é o ecossistema educacional oficial da EEEP Deputado Roberto Mesquita. Ele automatiza a parte
          mecânica do trabalho pedagógico — pesquisa, diagramação e gabarito — para que professores invistam o tempo
          onde importa: mediar a aprendizagem. Alunos ganham simulados personalizados com correção imediata e
          justificativas construídas a partir de questões reais de vestibulares.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {PILLARS.map((p) => (
          <Card key={p.title} className="glass-card p-4 transition-transform duration-300 hover:-translate-y-1">
            <p.icon className="h-5 w-5 text-primary mb-2" />
            <h3 className="text-sm font-semibold">{p.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{p.text}</p>
          </Card>
        ))}
      </div>

      <Card className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquareHeart className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Feedback e sugestões</h3>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="h-9 text-sm" placeholder="Opcional" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail</Label>
              <Input value={mail} onChange={(e) => setMail(e.target.value)} maxLength={160} className="h-9 text-sm" placeholder="Opcional" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sua mensagem *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={4}
              className="text-sm"
              placeholder="Conte o que podemos melhorar..."
            />
          </div>
          <Button type="submit" className="gap-2" disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar sugestão
          </Button>
        </form>
      </Card>
    </section>
  );
}
