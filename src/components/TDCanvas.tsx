import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Editable } from './Editable';
import { LETTERS } from '@/types/td';
import type { TD, TDQuestion } from '@/types/td';

interface TDCanvasProps {
  td: TD;
  onChange: (td: TD) => void;
}

/** Field shown in the school letterhead header. */
function HeaderField({ label, value, onCommit, grow }: { label: string; value: string; onCommit: (v: string) => void; grow?: boolean }) {
  return (
    <div className={`flex items-end gap-1 text-[11px] ${grow ? 'flex-1' : ''}`}>
      <span className="font-semibold whitespace-nowrap">{label}:</span>
      <Editable as="span" value={value} onCommit={onCommit} className="flex-1 border-b border-dotted border-foreground/40 min-w-[60px]" />
    </div>
  );
}

export function TDCanvas({ td, onChange }: TDCanvasProps) {
  const isPro = td.authorRole === 'Professor';
  const showCommented = td.answerKeyMode === 'commented';
  const showSheet = td.answerKeyMode === 'sheet' || td.answerKeyMode === 'simple';

  const updateQuestion = (q: TDQuestion) =>
    onChange({ ...td, questions: td.questions.map((x) => (x.id === q.id ? q : x)) });

  const renderQuestion = (q: TDQuestion, i: number) => (
    <div key={q.id} className="td-question break-inside-avoid mb-4">
      <div className="text-[12px] leading-snug">
        <span className="font-bold mr-1">{i + 1}.</span>
        <Editable as="span" value={q.text} onCommit={(v) => updateQuestion({ ...q, text: v })} />
      </div>
      <div className="mt-1.5 space-y-1 pl-4">
        {q.alternatives.map((alt, idx) => (
          <div key={idx} className="flex gap-1.5 text-[11px] leading-snug">
            <span className="font-semibold">{LETTERS[idx]})</span>
            <Editable
              as="span"
              value={alt}
              onCommit={(v) => {
                const alternatives = [...q.alternatives];
                alternatives[idx] = v;
                updateQuestion({ ...q, alternatives });
              }}
              className="flex-1"
            />
          </div>
        ))}
      </div>
      {/* Gabarito comentado integrado ao documento (Professor) */}
      {showCommented && (
        <div className="mt-1.5 pl-4 text-[10px] text-foreground/70 leading-snug">
          <span className="font-semibold">Gabarito ({q.correct}): </span>
          {q.explanation}
        </div>
      )}
    </div>
  );

  return (
    <div className="td-canvas bg-white text-black mx-auto shadow-sm border border-border rounded-sm">
      <div className="p-[12mm]">
        {/* Letterhead */}
        <div className="border border-black">
          <div className="text-center font-bold text-[14px] py-2 border-b border-black">
            <Editable as="span" value={td.school} onCommit={(v) => onChange({ ...td, school: v })} className="font-bold" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-2">
            <HeaderField label="Disciplina" value={td.subject} onCommit={(v) => onChange({ ...td, subject: v })} />
            <HeaderField label="Professor(a)" value={td.teacher} onCommit={(v) => onChange({ ...td, teacher: v })} />
            <HeaderField label="Aluno(a)" value={''} onCommit={() => {}} grow />
            <HeaderField label="Turma" value={td.className} onCommit={(v) => onChange({ ...td, className: v })} />
            <HeaderField
              label="Data"
              value={format(new Date(td.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
              onCommit={() => {}}
            />
            <HeaderField label="Nota" value={''} onCommit={() => {}} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center font-bold text-[15px] mt-4 mb-3 uppercase">{td.topic}</h2>

        {/* Theory */}
        {td.theory && (
          <div className="mb-4 text-[11.5px] leading-relaxed text-justify break-inside-avoid">
            <div className="font-bold mb-1">Resumo Teórico</div>
            <Editable value={td.theory} onCommit={(v) => onChange({ ...td, theory: v })} className="whitespace-pre-line block" />
          </div>
        )}

        {/* Questions */}
        <div className="font-bold text-[12px] mb-2">Questões</div>
        {isPro ? (
          <div className="columns-2 gap-6 [&>div]:break-inside-avoid divide-x divide-black/0 td-columns">
            {td.questions.map((q, i) => renderQuestion(q, i))}
          </div>
        ) : (
          <div className="space-y-1">{td.questions.map((q, i) => renderQuestion(q, i))}</div>
        )}

        {/* Answer key: sheet/simple — letter matrix at the end */}
        {showSheet && (
          <div className="mt-6 pt-3 border-t border-black break-inside-avoid">
            <div className="font-bold text-[12px] mb-2">Gabarito (Folha de Respostas)</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
              {td.questions.map((q, i) => (
                <span key={q.id} className="font-medium">
                  {i + 1}. {q.correct}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
