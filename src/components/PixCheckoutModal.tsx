import { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Check, Sparkles, ShieldCheck, Loader2, Clock3, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { buildPixPayload, PRO_PRICE } from '@/lib/pix';
import { usePixKey } from '@/hooks/useSettings';
import type { ProRequest } from '@/hooks/useProRequest';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Registra a solicitação de auditoria do pagamento (não libera o PRO). */
  onRequestPro: (pixKey: string) => Promise<boolean>;
  request: ProRequest | null;
}

const BENEFITS = [
  'Simulados ilimitados gerados por IA',
  'Gabarito comentado detalhado em cada questão',
  'Simulados oficiais ENEM por área com cronômetro',
  'Acesso vitalício — pagamento único',
];

export function PixCheckoutModal({ open, onOpenChange, onRequestPro, request }: Props) {
  const { pixKey } = usePixKey();
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const payload = useMemo(() => buildPixPayload({ key: pixKey }), [pixKey]);
  const pending = request?.status === 'PENDENTE';
  const refused = request?.status === 'RECUSADO';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success('Código Pix copiado!');
    setTimeout(() => setCopied(false), 2200);
  };

  const handleConfirm = async () => {
    setSending(true);
    const ok = await onRequestPro(pixKey);
    setSending(false);
    if (ok) toast.success('Solicitação enviada para conferência do administrador.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-panel max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="gap-1"><Sparkles className="h-3 w-3" /> PRO</Badge>
            <DialogTitle className="text-xl font-serif">
              {pending ? 'Aguardando confirmação do administrador' : `Seja PRO por R$ ${PRO_PRICE.toFixed(2).replace('.', ',')}`}
            </DialogTitle>
          </div>
          <DialogDescription>
            {pending
              ? 'Recebemos o aviso do seu pagamento. Assim que a equipe conferir o Pix, o acesso PRO será liberado automaticamente nesta conta.'
              : 'Pagamento único via Pix. Liberação após conferência manual do pagamento.'}
          </DialogDescription>
        </DialogHeader>

        {pending ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <Clock3 className="h-7 w-7 text-primary animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">
              Status atual: <strong className="text-foreground">Em análise</strong>. Você não precisa pagar novamente —
              basta aguardar. A tela é atualizada sozinha quando a aprovação sair.
            </p>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <>
            {refused && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span>
                  Sua última solicitação foi recusada por falta de comprovação. Refaça o pagamento e avise novamente.
                </span>
              </div>
            )}

            <ul className="space-y-1.5">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" /> {b}
                </li>
              ))}
            </ul>

            <div className="flex justify-center py-3">
              <div className="rounded-xl bg-white p-3 shadow-md">
                <QRCodeCanvas value={payload} size={168} level="M" includeMargin={false} />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pix Copia e Cola</span>
              <p className="max-h-24 overflow-y-auto break-all rounded-lg border border-border bg-muted/50 p-2.5 text-[10px] leading-relaxed font-mono">
                {payload}
              </p>
              <Button variant="outline" className="w-full gap-2 transition-all" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar Código Pix'}
              </Button>
            </div>

            <Button className="w-full gap-2 h-11 font-semibold" onClick={handleConfirm} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Já realizei o pagamento
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              O acesso PRO é liberado somente após a conferência manual do pagamento pela administração.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
