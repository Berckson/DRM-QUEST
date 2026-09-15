import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PRO_PRICE } from '@/lib/pix';

export interface ProRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  amount: number;
  pix_key: string;
  status: 'PENDENTE' | 'APROVADO' | 'RECUSADO';
  created_at: string;
}

/** Solicitação de upgrade PRO do próprio aluno (auditoria manual do administrador). */
export function useProRequest(userId: string | undefined) {
  const [request, setRequest] = useState<ProRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setRequest(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('pro_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setRequest((data as ProRequest) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('pro_requests_self')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pro_requests', filter: `user_id=eq.${userId}` },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  const submit = useCallback(
    async (info: { fullName: string; email: string; pixKey: string }) => {
      if (!userId) return false;
      if (request?.status === 'PENDENTE') return true;
      const { error } = await supabase.from('pro_requests').insert({
        user_id: userId,
        full_name: info.fullName,
        email: info.email,
        pix_key: info.pixKey,
        amount: PRO_PRICE,
        status: 'PENDENTE',
      });
      if (error) {
        toast.error('Não foi possível registrar sua solicitação');
        return false;
      }
      await refetch();
      return true;
    },
    [userId, request, refetch]
  );

  return { request, loading, submit, refetch };
}

/** Lista em tempo real de solicitações Pix (painel do Admin). */
export function useAllProRequests(enabled: boolean) {
  const [requests, setRequests] = useState<ProRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    const { data } = await supabase
      .from('pro_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests((data as ProRequest[]) ?? []);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel('pro_requests_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pro_requests' }, () => refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, refetch]);

  return { requests, loading, refetch };
}
