import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Question {
  id: string;
  text: string;
  origin: string;
  level: 'teoria' | 'facil' | 'media' | 'dificil';
  answer: string;
}

export interface Activity {
  id: string;
  school: string;
  subject: string;
  teacher: string;
  topic: string;
  source: string;
  theory: string;
  questions: Question[];
  levels: { teoria: number; facil: number; media: number; dificil: number };
  createdAt: string;
}

function mapRow(row: any): Activity {
  return {
    id: row.id,
    school: row.school || '',
    subject: row.subject || '',
    teacher: row.teacher || '',
    topic: row.topic,
    source: row.source || '',
    theory: row.theory || '',
    questions: (row.questions as Question[]) || [],
    levels: (row.levels as any) || { teoria: 0, facil: 0, media: 0, dificil: 0 },
    createdAt: row.created_at,
  };
}

export function useActivities(userId: string | undefined) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      console.error('Error fetching activities:', error);
      return;
    }
    setActivities((data || []).map(mapRow));
  }, [userId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const generateActivity = useCallback(async (data: {
    school: string;
    subject: string;
    teacher: string;
    topic: string;
    source: string;
    levels: { teoria: number; facil: number; media: number; dificil: number };
  }) => {
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
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      toast.error(err.error || 'Erro ao gerar atividade');
      return null;
    }

    const row = await response.json();
    const activity = mapRow(row);
    setActivities(prev => [activity, ...prev]);
    setActiveId(activity.id);
    return activity;
  }, []);

  const updateActivity = useCallback(async (updated: Activity) => {
    const { error } = await supabase
      .from('activities')
      .update({
        school: updated.school,
        subject: updated.subject,
        teacher: updated.teacher,
        theory: updated.theory,
        questions: updated.questions as any,
      })
      .eq('id', updated.id);

    if (error) {
      toast.error('Erro ao salvar alterações');
      return;
    }
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
  }, []);

  const deleteActivity = useCallback(async (id: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir atividade');
      return;
    }
    setActivities(prev => prev.filter(a => a.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const active = activities.find(a => a.id === activeId) ?? null;

  return { activities, active, activeId, setActiveId, generateActivity, updateActivity, deleteActivity, loading };
}
