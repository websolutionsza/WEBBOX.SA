-- ============================================================================
-- WEB BOX SA — Phase 3 migration
-- ============================================================================
-- Adds the availability_status column to the games table.
--
-- This migration is IDEMPOTENT — safe to run more than once.
--
-- WHAT IT DOES:
--   1. Adds availability_status as a TEXT column on games.
--   2. Adds a CHECK constraint restricting it to four values:
--        'available', 'unavailable', 'removed', 'needs_verification'.
--   3. Defaults existing rows to 'needs_verification' so every current
--      game appears with a "Pending review" badge until you explicitly
--      mark each one.
--   4. Updates the public_read_games RLS policy to also require
--      availability_status <> 'removed' (in addition to is_published = true)
--      so removed games are filtered at the database level, not just
--      in the API layer.
--
-- AFTER RUNNING:
--   * All 51 existing games will show "Pending review" in the UI.
--   * Their launch buttons will be DISABLED until you mark them as
--     'available' in the Table Editor.
--   * This is intentional — it forces you to review each game before
--     it goes live.
--
-- HOW TO REVIEW EACH GAME:
--   In Supabase → Table Editor → games → click any row → change the
--   availability_status dropdown:
--     * 'available'           → launch button enabled, normal badge
--     * 'unavailable'         → launch button disabled, "Unavailable" badge
--     * 'needs_verification'  → launch button disabled, "Pending review" badge
--     * 'removed'             → game completely hidden from public library
-- ============================================================================

-- Step 1: Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'games'
      AND column_name = 'availability_status'
  ) THEN
    ALTER TABLE public.games
      ADD COLUMN availability_status TEXT;
  END IF;
END $$;

-- Step 2: Backfill any NULL values with 'needs_verification'
UPDATE public.games
SET availability_status = 'needs_verification'
WHERE availability_status IS NULL;

-- Step 3: Add the CHECK constraint (drop first if it already exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'games_availability_status_check'
  ) THEN
    ALTER TABLE public.games DROP CONSTRAINT games_availability_status_check;
  END IF;
END $$;

ALTER TABLE public.games
  ADD CONSTRAINT games_availability_status_check
  CHECK (
    availability_status IN (
      'available',
      'unavailable',
      'removed',
      'needs_verification'
    )
  );

-- Step 4: Set the default for future inserts
ALTER TABLE public.games
  ALTER COLUMN availability_status
  SET DEFAULT 'needs_verification';

-- Step 5: Drop the old public_read_games policy and recreate with the
-- stricter filter that also excludes 'removed' games.
-- (This is defensive — the API layer already filters them out, but
--  defence in depth: the database should also enforce it.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'games'
      AND policyname = 'public_read_games'
  ) THEN
    DROP POLICY public_read_games ON public.games;
  END IF;
END $$;

CREATE POLICY public_read_games ON public.games
  FOR SELECT TO anon, authenticated
  USING (
    is_published = true
    AND availability_status <> 'removed'
  );

-- ============================================================================
-- DONE. Verification queries you can run separately:
-- ============================================================================

-- Verify the column exists with the right type + default:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'games' AND column_name = 'availability_status';

-- Verify the CHECK constraint exists:
-- SELECT conname, pg_get_constraintdef(oid) AS definition
-- FROM pg_constraint
-- WHERE conname = 'games_availability_status_check';

-- Verify the policy was updated:
-- SELECT polname, pg_get_expr(polqual, polrelid) AS using_expr
-- FROM pg_policy
-- WHERE polname = 'public_read_games';

-- Count of games by availability_status (should show 51 needs_verification):
-- SELECT availability_status, COUNT(*) FROM public.games GROUP BY availability_status;
