import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Question, LEVEL_LABELS, LEVEL_COLORS } from '@/types/activity';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (updated: Question) => void;
  showAnswer?: boolean;
}

export function QuestionCard({ question, index, onUpdate, showAnswer = false }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(showAnswer);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(question.text);

  const handleBlur = () => {
    setEditing(false);
    if (text !== question.text) {
      onUpdate({ ...question, text });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-4 academic-shadow hover:academic-shadow-lg transition-shadow">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className={`text-[10px] ${LEVEL_COLORS[question.level]}`}>
                {LEVEL_LABELS[question.level]}
              </Badge>
              {question.origin !== 'Autoral' && (
                <Badge variant="outline" className="text-[10px]">
                  [{question.origin}]
                </Badge>
              )}
            </div>

            {editing ? (
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onBlur={handleBlur}
                autoFocus
                className="text-sm min-h-[60px]"
              />
            ) : (
              <p
                className="text-sm text-foreground leading-relaxed cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors"
                onClick={() => setEditing(true)}
                title="Clique para editar"
              >
                {question.text}
              </p>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Ocultar resposta' : 'Ver resposta'}
            </button>

            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-2 p-3 rounded-md bg-muted/50 border border-border"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">{question.answer}</p>
              </motion.div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
