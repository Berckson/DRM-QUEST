-- 1) Nenhuma tabela deve ser legível por visitantes anônimos
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.activities FROM anon;
REVOKE ALL ON public.generated_tds FROM anon;
REVOKE ALL ON public.teacher_requests FROM anon;
REVOKE ALL ON public.feedbacks FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.app_settings FROM anon;

-- 2) Garantir os privilégios corretos para usuários autenticados (RLS continua filtrando por dono)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_tds TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.teacher_requests TO authenticated;
GRANT SELECT, INSERT ON public.feedbacks TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.activities TO service_role;
GRANT ALL ON public.generated_tds TO service_role;
GRANT ALL ON public.teacher_requests TO service_role;
GRANT ALL ON public.feedbacks TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.app_settings TO service_role;

-- 3) Funções SECURITY DEFINER não devem ser chamáveis diretamente pela API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_profile_escalation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_teacher_request(uuid, boolean) FROM PUBLIC, anon;

-- has_role é usada dentro das policies (executa como owner nelas), mas mantemos
-- execução para authenticated pois algumas policies a chamam no contexto do usuário.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
-- Apenas admins passam pela checagem interna da função de aprovação.
GRANT EXECUTE ON FUNCTION public.review_teacher_request(uuid, boolean) TO authenticated;