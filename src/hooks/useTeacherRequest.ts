import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeacherRequest {
  id: string;
  user_id: string;
  full_name: string;
  school: string;
  institutional_email: string;
  phone: string;
  status: 'PENDENTE' | 'APROVADO' | 'RECUSADO';
  created_at: string;
}

export function useTeacherRequest(userId: string | undefined) {
  const [request, setRequest] = useState<TeacherRequest | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) return setRequest(null);
    const { data } = await supabase
      .from('teacher_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setRequest((data as TeacherRequest) ?? null);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { request, refetch: fetch };
}

/** Lista em tempo real de solicitações (painel do Admin). */
export function useAllTeacherRequests(enabled: boolean) {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const { data } = await supabase
      .from('teacher_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests((data as TeacherRequest[]) ?? []);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel('teacher_requests_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_requests' }, () => fetch())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, fetch]);

  return { requests, loading, refetch: fetch };
}
