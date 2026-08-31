import { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Copy, Check, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { buildPixPayload, PRO_PRICE } from '@/lib/pix';
import { usePixKey } from '@/hooks/useSettings';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmPayment: () => Promise<boolean>;
}

const BENEFITS = [
  'Simulados ilimitados gerados por IA',
  'Gabarito comentado detalhado em cada questão',
  'Espelhar modelos de prova em PDF',
  'Acesso vitalício — pagamento único',
];

export function PixCheckoutModal({ open, onOpenChange, onConfirmPayment }: Props) {
  const { pixKey } = usePixKey();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const payload = useMemo(() => buildPixPayload({ key: pixKey }), [pixKey]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success('Código Pix copiado!');
    setTimeout(() => setCopied(false), 2200);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    const ok = await onConfirmPayment();
    setConfirming(false);
    if (!ok) return;
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { y: 0.5 } }), 300);
    toast.success('Bem-vindo ao DRM Quest PRO! 🎉');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-panel max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="gap-1"><Sparkles className="h-3 w-3" /> PRO</Badge>
            <DialogTitle className="text-xl font-serif">Seja PRO por R$ {PRO_PRICE.toFixed(2).replace('.', ',')}</DialogTitle>
          </div>
          <DialogDescription>Pagamento único via Pix. Acesso vitalício ao DRM Quest PRO.</DialogDescription>
        </DialogHeader>

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

        <Button className="w-full gap-2 h-11 font-semibold" onClick={handleConfirm} disabled={confirming}>
          {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Já realizei o pagamento
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">
          Confirmação simulada nesta versão MVP. Chave Pix aleatória gerenciada pela administração.
        </p>
      </DialogContent>
    </Dialog>
  );
}
