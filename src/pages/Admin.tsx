import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, ShieldAlert, KeyRound, Loader2, Mail, Phone, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAllTeacherRequests } from '@/hooks/useTeacherRequest';
import { usePixKey } from '@/hooks/useSettings';
import { sanitizeText } from '@/lib/sanitize';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PENDENTE: 'secondary',
  APROVADO: 'default',
  RECUSADO: 'destructive',
};

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: profileLoading } = useProfile(user?.id);
  const { requests, loading } = useAllTeacherRequests(isAdmin);
  const { pixKey, saveKey } = usePixKey();
  const [keyDraft, setKeyDraft] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  if (authLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando...</div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass-card p-8 text-center max-w-sm">
          <ShieldAlert className="h-8 w-8 text-destructive mx-auto mb-3" />
          <h1 className="text-lg font-semibold mb-1">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground mb-4">Esta área é exclusiva para administradores do DRM Quest.</p>
          <Button asChild variant="outline" size="sm"><Link to="/">Voltar ao início</Link></Button>
        </Card>
      </div>
    );
  }

  const review = async (id: string, approve: boolean) => {
    setBusy(id);
    const { error } = await supabase.rpc('review_teacher_request', { _request_id: id, _approve: approve });
    setBusy(null);
    if (error) return toast.error('Erro ao processar solicitação');
    toast.success(approve ? 'Professor aprovado!' : 'Solicitação recusada');
  };

  const pending = requests.filter((r) => r.status === 'PENDENTE');
  const history = requests.filter((r) => r.status !== 'PENDENTE');

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
          </Button>
          <Badge>Administrador</Badge>
        </div>

        <div>
          <h1 className="text-2xl font-serif font-bold">Painel do Administrador</h1>
          <p className="text-sm text-muted-foreground">Valide docentes e gerencie a chave Pix da plataforma.</p>
        </div>

        <Card className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Chave Pix da plataforma</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Chave atual</Label>
              <Input
                value={keyDraft || pixKey}
                onChange={(e) => setKeyDraft(e.target.value)}
                className="h-9 text-sm font-mono"
                maxLength={90}
              />
            </div>
            <Button className="sm:self-end h-9" onClick={() => saveKey(sanitizeText(keyDraft || pixKey, 90))}>
              Salvar
            </Button>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Solicitações pendentes ({pending.length})
          </h2>
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && pending.length === 0 && (
            <Card className="glass-card p-6 text-center text-sm text-muted-foreground">
              Nenhuma solicitação pendente no momento.
            </Card>
          )}
          {pending.map((r) => (
            <Card key={r.id} className="glass-card p-4 transition-shadow hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">{r.full_name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><School className="h-3.5 w-3.5" />{r.school}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" />{r.institutional_email}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" />{r.phone}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5" disabled={busy === r.id} onClick={() => review(r.id, true)}>
                    {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Aprovar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={busy === r.id} onClick={() => review(r.id, false)}>
                    <X className="h-3.5 w-3.5" /> Recusar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </section>

        {history.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Histórico</h2>
            {history.map((r) => (
              <Card key={r.id} className="glass-card p-3 flex items-center justify-between gap-3">
                <div className="text-sm">
                  <span className="font-medium">{r.full_name}</span>
                  <span className="text-xs text-muted-foreground"> · {r.institutional_email}</span>
                </div>
                <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
              </Card>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
