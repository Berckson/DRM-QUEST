import { ExternalLink, PenLine, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRedacaoUrl } from '@/hooks/useSettings';

const COMPETENCIAS = [
  'Domínio da norma culta da língua escrita',
  'Compreender a proposta e aplicar conceitos das áreas',
  'Selecionar, relacionar e organizar informações',
  'Conhecimento dos mecanismos linguísticos de argumentação',
  'Proposta de intervenção com respeito aos direitos humanos',
];

/** Módulo externo: encaminha o aluno à plataforma parceira de redação. */
export function RedacaoPanel() {
  const { redacaoUrl } = useRedacaoUrl();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="glass-card overflow-hidden">
        <div className="bg-gradient-to-br from-primary/12 to-transparent p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="gap-1"><PenLine className="h-3 w-3" /> Parceria</Badge>
          </div>
          <h2 className="text-2xl font-serif font-bold">Redação ENEM com correção especializada</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            A redação é trabalhada em uma plataforma parceira dedicada, com treino e devolutiva nas 5 competências
            oficiais do ENEM. O DRM Quest concentra-se nos simulados objetivos e encaminha você direto para lá.
          </p>

          <ul className="mt-5 space-y-2">
            {COMPETENCIAS.map((c, i) => (
              <li key={c} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span><strong className="font-medium">Competência {i + 1}:</strong> {c}</span>
              </li>
            ))}
          </ul>

          <Button asChild size="lg" className="mt-6 w-full gap-2 h-12 font-semibold transition-transform hover:scale-[1.01]">
            <a href={redacaoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Acessar Plataforma Externa de Redação
            </a>
          </Button>
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            O link abre em uma nova aba. Seu progresso no DRM Quest permanece salvo.
          </p>
        </div>
      </Card>
    </div>
  );
}
