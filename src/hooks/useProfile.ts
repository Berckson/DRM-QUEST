import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserRole } from '@/types/td';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole | null;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setLoading(false);
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    setProfile(data as Profile | null);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const selectRole = useCallback(
    async (role: UserRole) => {
      if (!userId) return;
      // Upsert guarantees a row exists even if the signup trigger lagged.
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, role }, { onConflict: 'id' });
      if (error) {
        toast.error('Erro ao salvar seu perfil');
        return;
      }
      setProfile((prev) => (prev ? { ...prev, role } : { id: userId, email: null, full_name: null, role }));
      toast.success(`Perfil definido como ${role}`);
    },
    [userId]
  );

  return { profile, loading, selectRole, refetch: fetchProfile };
}
