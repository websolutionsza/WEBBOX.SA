-- ============================================================================
-- WEB BOX SA — Phase 5 migration
-- ============================================================================
-- Creates the feedback table with secure RLS policies and a SECURITY DEFINER
-- submission function.
--
-- SECURITY MODEL
--   * anon role (browser, using SUPABASE_ANON_KEY):
--     - Can call public.submit_feedback(category, message, game_slug) to INSERT
--       a feedback row, with input validation.
--     - CANNOT read, update or delete feedback.
--     - CANNOT do raw INSERTs on the table (no INSERT policy defined).
--   * authenticated role (admin user only — email findahustlesa@yahoo.com):
--     - Can SELECT, UPDATE, DELETE feedback rows.
--     - The email allowlist is enforced at the database level via RLS,
--       independent of the frontend. Even if someone else creates an account
--       via Supabase Auth, they cannot read feedback.
--
-- This migration is IDEMPOTENT — safe to run more than once.
-- ============================================================================

-- Step 1: Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text        NOT NULL,
  message     text        NOT NULL,
  game_slug   text,                       -- optional, for broken_game reports
  status      text        NOT NULL DEFAULT 'new',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT feedback_category_check CHECK (
    category IN ('broken_game', 'technical_issue', 'suggestion', 'general')
  ),
  CONSTRAINT feedback_status_check CHECK (
    status IN ('new', 'reviewed', 'resolved')
  ),
  CONSTRAINT feedback_message_length_check CHECK (
    length(message) >= 1 AND length(message) <= 2000
  )
);

CREATE INDEX IF NOT EXISTS idx_feedback_status     ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_category   ON public.feedback(category);

-- Step 2: Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop any existing policies (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feedback' AND policyname='anon_insert_feedback') THEN
    DROP POLICY anon_insert_feedback ON public.feedback;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feedback' AND policyname='admin_read_feedback') THEN
    DROP POLICY admin_read_feedback ON public.feedback;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feedback' AND policyname='admin_update_feedback') THEN
    DROP POLICY admin_update_feedback ON public.feedback;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feedback' AND policyname='admin_delete_feedback') THEN
    DROP POLICY admin_delete_feedback ON public.feedback;
  END IF;
END $$;

-- Step 4: Define RLS policies
-- NOTE: No INSERT policy for anon — they cannot insert directly.
-- They must go through the submit_feedback() function below.

-- Admin (specific email) can SELECT all feedback
CREATE POLICY admin_read_feedback ON public.feedback
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'findahustlesa@yahoo.com');

-- Admin can UPDATE feedback status
CREATE POLICY admin_update_feedback ON public.feedback
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = 'findahustlesa@yahoo.com');

-- Admin can DELETE spam / inappropriate submissions
CREATE POLICY admin_delete_feedback ON public.feedback
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' = 'findahustlesa@yahoo.com');

-- Step 5: Create the secure submission function (SECURITY DEFINER)
-- This function runs with the table owner's privileges, NOT the caller's.
-- It validates the category and message length before inserting.
-- The browser calls this via Supabase RPC — it never touches the table directly.
CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_category text,
  p_message text,
  p_game_slug text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  v_category text;
  v_game_slug text;
BEGIN
  v_category := lower(trim(p_category));
  v_game_slug := NULLIF(trim(p_game_slug), '');

  IF v_category NOT IN ('broken_game', 'technical_issue', 'suggestion', 'general') THEN
    RAISE EXCEPTION 'Invalid feedback category: %', p_category
      USING ERRCODE = '23514';
  END IF;

  IF p_message IS NULL OR length(p_message) < 1 OR length(p_message) > 2000 THEN
    RAISE EXCEPTION 'Feedback message must be between 1 and 2000 characters.'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.feedback (category, message, game_slug, status)
  VALUES (v_category, p_message, v_game_slug, 'new')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Step 6: Grant execute on the submission function to anon + authenticated
GRANT EXECUTE ON FUNCTION public.submit_feedback(text, text, text) TO anon, authenticated;

-- Step 7: Add the updated_at auto-trigger (same pattern as games/characters)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_updated_at ON public.feedback;
CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- DONE. Verification queries you can run separately:
-- ============================================================================

-- Verify the table:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'feedback' ORDER BY ordinal_position;

-- Verify the policies:
-- SELECT polname, cmd, pg_get_expr(polqual, polrelid) AS using_expr
-- FROM pg_policy WHERE polrelid = 'public.feedback'::regclass;

-- Verify the function exists:
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'submit_feedback';

-- Test the function (should return a UUID):
-- SELECT public.submit_feedback('general', 'This is a test feedback message.', NULL);

-- Test that anon CANNOT select (should return 0 rows or permission denied):
-- SET ROLE anon;
-- SELECT count(*) FROM public.feedback;  -- should fail or return 0
-- RESET ROLE;
