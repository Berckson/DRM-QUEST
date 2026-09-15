-- Pix PRO upgrade requests (manual admin audit)
CREATE TABLE public.pro_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 24.99,
  pix_key text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'PENDENTE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pro_requests_status_check CHECK (status IN ('PENDENTE','APROVADO','RECUSADO'))
);

GRANT SELECT, INSERT ON public.pro_requests TO authenticated;
GRANT UPDATE ON public.pro_requests TO authenticated;
GRANT ALL ON public.pro_requests TO service_role;

ALTER TABLE public.pro_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own pro request"
  ON public.pro_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own pro request"
  ON public.pro_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pro requests"
  ON public.pro_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can update pro requests"
  ON public.pro_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE TRIGGER update_pro_requests_updated_at
  BEFORE UPDATE ON public.pro_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Block self-service PRO activation from the client
CREATE OR REPLACE FUNCTION public.prevent_pro_self_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_pro AND NOT public.has_role(auth.uid(), 'ADMIN') THEN
      NEW.is_pro := false;
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.is_pro IS DISTINCT FROM OLD.is_pro AND NOT public.has_role(auth.uid(), 'ADMIN') THEN
    NEW.is_pro := OLD.is_pro;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_prevent_pro_self_grant
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_pro_self_grant();

-- Admin review of a PRO payment request
CREATE OR REPLACE FUNCTION public.review_pro_request(_request_id uuid, _approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'ADMIN') THEN
    RAISE EXCEPTION 'Apenas administradores podem revisar solicitações';
  END IF;

  SELECT user_id INTO _uid FROM public.pro_requests WHERE id = _request_id;
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  UPDATE public.pro_requests
     SET status = CASE WHEN _approve THEN 'APROVADO' ELSE 'RECUSADO' END
   WHERE id = _request_id;

  IF _approve THEN
    UPDATE public.profiles SET is_pro = true WHERE id = _uid;
  END IF;
END;
$$;

INSERT INTO public.app_settings (key, value)
VALUES ('redacao_url', 'https://www.estudeadistancia.com/redacao-enem')
ON CONFLICT (key) DO NOTHING;