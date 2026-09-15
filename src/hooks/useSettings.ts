import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEFAULT_PIX_KEY } from '@/lib/pix';

export const DEFAULT_REDACAO_URL = 'https://www.estudeadistancia.com/redacao-enem';

/** Configuração genérica da plataforma (tabela app_settings). */
export function useAppSetting(key: string, fallback: string) {
  const [value, setValue] = useState(fallback);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
    setValue(data?.value?.trim() ? data.value.trim() : fallback);
    setLoading(false);
  }, [key, fallback]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = useCallback(
    async (next: string) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value: next.trim() }, { onConflict: 'key' });
      if (error) {
        toast.error('Apenas administradores podem alterar as configurações');
        return false;
      }
      setValue(next.trim() || fallback);
      toast.success('Configuração atualizada');
      return true;
    },
    [key, fallback]
  );

  return { value, loading, save, refetch };
}

/** Chave Pix da plataforma, com fallback para a chave aleatória padrão. */
export function usePixKey() {
  const { value, loading, save, refetch } = useAppSetting('pix_key', DEFAULT_PIX_KEY);
  return { pixKey: value, loading, saveKey: save, refetch };
}

/** URL da plataforma parceira de redação. */
export function useRedacaoUrl() {
  const { value, loading, save, refetch } = useAppSetting('redacao_url', DEFAULT_REDACAO_URL);
  return { redacaoUrl: value, loading, saveUrl: save, refetch };
}
