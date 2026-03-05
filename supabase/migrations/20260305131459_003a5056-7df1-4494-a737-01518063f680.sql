-- Create activities table
CREATE TABLE public.activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    teacher TEXT NOT NULL DEFAULT '',
    topic TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT '',
    theory TEXT NOT NULL DEFAULT '',
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    levels JSONB NOT NULL DEFAULT '{"teoria":0,"facil":0,"media":0,"dificil":0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own activities"
ON public.activities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
ON public.activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
ON public.activities FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
ON public.activities FOR DELETE
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);