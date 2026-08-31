import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEFAULT_PIX_KEY } from '@/lib/pix';

/** Chave Pix da plataforma, com fallback para a chave aleatória padrão. */
export function usePixKey() {
  const [pixKey, setPixKey] = useState<string>(DEFAULT_PIX_KEY);
  const [loading, setLoading] = useState(true);

  const fetchKey = useCallback(async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'pix_key').maybeSingle();
    setPixKey(data?.value?.trim() ? data.value.trim() : DEFAULT_PIX_KEY);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKey();
  }, [fetchKey]);

  const saveKey = useCallback(async (value: string) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'pix_key', value: value.trim() }, { onConflict: 'key' });
    if (error) {
      toast.error('Apenas administradores podem alterar a chave Pix');
      return false;
    }
    setPixKey(value.trim() || DEFAULT_PIX_KEY);
    toast.success('Chave Pix atualizada');
    return true;
  }, []);

  return { pixKey, loading, saveKey, refetch: fetchKey };
}
