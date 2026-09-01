import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  TD,
  TDQuestion,
  AnswerKeyMode,
  GenerationMode,
  UserRole,
  DifficultyFocus,
} from '@/types/td';

function mapRow(row: any): TD {
  return {
    id: row.id,
    school: row.school || 'EEEP Deputado Roberto Mesquita',
    subject: row.subject || '',
    teacher: row.teacher || '',
    className: row.class_name || '',
    topic: row.topic,
    source: row.source || '',
    mode: (row.mode as GenerationMode) || 'web',
    theory: row.theory || '',
    questions: (row.questions as TDQuestion[]) || [],
    questionCount: row.question_count || 0,
    answerKeyMode: (row.answer_key_mode as AnswerKeyMode) || 'simple',
    authorRole: (row.author_role as UserRole) || 'Aluno',
    createdAt: row.created_at,
  };
}

export interface GenerateParams {
  topic: string;
  source: string;
  mode: GenerationMode;
  modelText?: string;
  questionCount: number;
  difficultyFocus?: DifficultyFocus;
  subject: string;
  teacher: string;
  school: string;
  className: string;
  answerKeyMode: AnswerKeyMode;
  authorRole: UserRole;
}

export function useTDs(userId: string | undefined) {
  const [tds, setTds] = useState<TD[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTDs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('generated_tds')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      console.error('Error fetching TDs:', error);
      return;
    }
    setTds((data || []).map(mapRow));
  }, [userId]);

  useEffect(() => {
    fetchTDs();
  }, [fetchTDs]);

  // Realtime sync of the user's TD history (RLS keeps it scoped to the owner)
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('generated_tds_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'generated_tds', filter: `user_id=eq.${userId}` },
        () => {
          fetchTDs();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchTDs]);

  const generateTD = useCallback(async (params: GenerateParams): Promise<TD | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      toast.error('Você precisa estar logado');
      return null;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-activity`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      toast.error(err.error || 'Erro ao gerar atividade');
      return null;
    }

    const row = await response.json();
    const td = mapRow(row);
    setTds((prev) => [td, ...prev.filter((t) => t.id !== td.id)]);
    setActiveId(td.id);
    return td;
  }, []);

  const updateTD = useCallback(async (updated: TD) => {
    setTds((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    const { error } = await supabase
      .from('generated_tds')
      .update({
        school: updated.school,
        subject: updated.subject,
        teacher: updated.teacher,
        class_name: updated.className,
        theory: updated.theory,
        questions: updated.questions as any,
        question_count: updated.questions.length,
        answer_key_mode: updated.answerKeyMode,
      })
      .eq('id', updated.id);
    if (error) toast.error('Erro ao salvar alterações');
  }, []);

  const deleteTD = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('generated_tds').delete().eq('id', id);
      if (error) {
        toast.error('Erro ao excluir atividade');
        return;
      }
      setTds((prev) => prev.filter((t) => t.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId]
  );

  const active = tds.find((t) => t.id === activeId) ?? null;

  return { tds, active, activeId, setActiveId, generateTD, updateTD, deleteTD, loading };
}
