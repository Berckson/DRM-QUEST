-- ROLES
CREATE TYPE public.app_role AS ENUM ('ADMIN','PROFESSOR','ALUNO');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- PROFILES upgrade
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'ALUNO',
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_type_check CHECK (user_type IN ('ALUNO','PROFESSOR','ADMIN'));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- Anti privilege escalation: nobody can self-promote
CREATE OR REPLACE FUNCTION public.prevent_profile_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.user_type IS DISTINCT FROM 'ALUNO' AND NOT public.has_role(auth.uid(), 'ADMIN') THEN
      NEW.user_type := 'ALUNO';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.user_type IS DISTINCT FROM OLD.user_type
     AND NEW.user_type <> 'ALUNO'
     AND NOT public.has_role(auth.uid(), 'ADMIN') THEN
    RAISE EXCEPTION 'Alteração de perfil não permitida';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_prevent_escalation
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_escalation();

-- TEACHER REQUESTS
CREATE TABLE public.teacher_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  school text NOT NULL DEFAULT 'EEEP Deputado Roberto Mesquita',
  institutional_email text NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'PENDENTE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_requests_status_check CHECK (status IN ('PENDENTE','APROVADO','RECUSADO'))
);
GRANT SELECT, INSERT, UPDATE ON public.teacher_requests TO authenticated;
GRANT ALL ON public.teacher_requests TO service_role;
ALTER TABLE public.teacher_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own request" ON public.teacher_requests
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own request" ON public.teacher_requests
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all requests" ON public.teacher_requests
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admins can update requests" ON public.teacher_requests
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE TRIGGER update_teacher_requests_updated_at
BEFORE UPDATE ON public.teacher_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FEEDBACKS
CREATE TABLE public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedbacks TO authenticated;
GRANT ALL ON public.feedbacks TO service_role;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send their own feedback" ON public.feedbacks
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own feedback" ON public.feedbacks
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON public.feedbacks
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- APP SETTINGS (Pix key)
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read settings" ON public.app_settings
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert settings" ON public.app_settings
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admins can update settings" ON public.app_settings
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

INSERT INTO public.app_settings (key, value)
VALUES ('pix_key', '965a1162-2e88-4085-b8e1-badc9a46907c')
ON CONFLICT (key) DO NOTHING;

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin decision RPC
CREATE OR REPLACE FUNCTION public.review_teacher_request(_request_id uuid, _approve boolean)
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

  SELECT user_id INTO _uid FROM public.teacher_requests WHERE id = _request_id;
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  UPDATE public.teacher_requests
     SET status = CASE WHEN _approve THEN 'APROVADO' ELSE 'RECUSADO' END
   WHERE id = _request_id;

  IF _approve THEN
    UPDATE public.profiles SET user_type = 'PROFESSOR' WHERE id = _uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'PROFESSOR')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;