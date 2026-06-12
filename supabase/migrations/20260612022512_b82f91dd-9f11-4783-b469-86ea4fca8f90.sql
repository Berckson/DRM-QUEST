-- 1. Profiles table (role: Professor / Aluno)
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text CHECK (role IN ('Professor', 'Aluno')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- 2. generated_tds table (the TDs / activities)
CREATE TABLE public.generated_tds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school text NOT NULL DEFAULT 'EEEP Deputado Roberto Mesquita',
  subject text NOT NULL DEFAULT '',
  teacher text NOT NULL DEFAULT '',
  class_name text NOT NULL DEFAULT '',
  topic text NOT NULL,
  source text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT 'web',
  theory text NOT NULL DEFAULT '',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_count integer NOT NULL DEFAULT 0,
  answer_key_mode text NOT NULL DEFAULT 'simple',
  author_role text NOT NULL DEFAULT 'Aluno',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_tds TO authenticated;
GRANT ALL ON public.generated_tds TO service_role;

ALTER TABLE public.generated_tds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own TDs"
  ON public.generated_tds FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own TDs"
  ON public.generated_tds FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TDs"
  ON public.generated_tds FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TDs"
  ON public.generated_tds FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. Updated_at triggers (function already exists)
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_tds_updated_at
  BEFORE UPDATE ON public.generated_tds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Auto-create a profile row on signup (role left null -> triggers selection modal)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();