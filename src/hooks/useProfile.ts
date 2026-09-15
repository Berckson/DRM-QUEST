import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserType } from '@/types/td';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  /** Marcador da escolha inicial feita pelo usuário ('Aluno' | 'Professor'). */
  role: string | null;
  user_type: UserType;
  is_pro: boolean;
  school: string | null;
  phone: string | null;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data, error }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);
    setLoading(false);
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    setProfile(data as unknown as Profile | null);
    setIsAdmin(!!roles?.some((r) => r.role === 'ADMIN'));
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /** Aluno: acesso imediato. Professor: apenas registra a escolha (aguarda aprovação). */
  const chooseRole = useCallback(
    async (choice: 'Aluno' | 'Professor', extra?: { full_name?: string; school?: string; phone?: string }) => {
      if (!userId) return false;
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, role: choice, ...extra }, { onConflict: 'id' });
      if (error) {
        toast.error('Erro ao salvar seu perfil');
        return false;
      }
      await fetchProfile();
      return true;
    },
    [userId, fetchProfile]
  );

  // O plano PRO só é liberado pelo administrador (auditoria do pagamento Pix).
  // Alterações diretas de `is_pro` pelo cliente são bloqueadas por trigger no banco.

  // Mantém o perfil sincronizado quando o administrador aprova o pagamento.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('profile_self')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => fetchProfile()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchProfile]);

  const userType: UserType = (profile?.user_type as UserType) ?? 'ALUNO';
  const isTeacher = userType === 'PROFESSOR' || userType === 'ADMIN' || isAdmin;
  const needsSetup = !loading && (!profile || !profile.role);
  const teacherPending = !!profile && profile.role === 'Professor' && !isTeacher;

  return {
    profile,
    loading,
    isAdmin,
    userType,
    isTeacher,
    isPro: !!profile?.is_pro,
    needsSetup,
    teacherPending,
    chooseRole,
    activatePro,
    refetch: fetchProfile,
  };
}
