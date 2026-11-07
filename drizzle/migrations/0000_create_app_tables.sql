CREATE TABLE public.products (id text PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.searches (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), query text NOT NULL, platform text, source text NOT NULL DEFAULT 'oriane', data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.videos (id text PRIMARY KEY, search_id uuid REFERENCES public.searches(id) ON DELETE SET NULL, query text, platform text, score integer, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.analyses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), video_id text NOT NULL, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.prompts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id text, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX videos_created_at_idx ON public.videos (created_at DESC);

GRANT ALL ON public.products, public.searches, public.videos, public.analyses, public.prompts TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;