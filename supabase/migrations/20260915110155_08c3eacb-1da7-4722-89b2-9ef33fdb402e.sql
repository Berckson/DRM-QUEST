-- Trigger functions must not be callable through the API
REVOKE ALL ON FUNCTION public.prevent_pro_self_grant() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_profile_escalation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- RPCs: signed-in users only (each one checks admin/ownership internally)
REVOKE ALL ON FUNCTION public.review_pro_request(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_teacher_request(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_pro_request(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_teacher_request(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Nothing in this app is readable before sign-in
REVOKE SELECT ON public.pro_requests FROM anon;
REVOKE SELECT ON public.teacher_requests FROM anon;
REVOKE SELECT ON public.feedbacks FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.app_settings FROM anon;
REVOKE SELECT ON public.generated_tds FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.activities FROM anon;