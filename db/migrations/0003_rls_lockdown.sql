-- Quorum accesses PostgreSQL only through the server-side Drizzle connection.
-- Supabase Data API roles (anon / authenticated) must not read application tables.
-- RLS is enabled with no policies (default deny). Table owners still bypass RLS,
-- so the Drizzle connection keeps working. FORCE ROW LEVEL SECURITY would break it.
ALTER TABLE "polls" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "question_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "responses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "finalizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON TABLE public.polls, public.questions, public.question_options, public.participants, public.responses, public.finalizations, public.rate_limits FROM %I',
        role_name
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I',
        role_name
      );
    END IF;
  END LOOP;
END $$;
